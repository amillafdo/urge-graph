import { Typography, Space, Card, Statistic, Table, Button, Modal, Tag, Progress, Spin } from "antd";
import { useEffect, useState, useRef  } from "react";
import { Doughnut } from 'react-chartjs-2';
import { AntCloudOutlined, RetweetOutlined, AreaChartOutlined, TeamOutlined } from "@ant-design/icons";
import { v4 as uuidv4 } from "uuid";
import LiquidGauge from "react-liquid-gauge";
import { Gauge } from "@ant-design/plots";
import moment from "moment";
import { getTicketDates } from "../../API";

function Dashboard() {
  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}> Dashboard </Typography.Title>
      <Space direction="horizontal">
        <DashboardCard title={<span><AntCloudOutlined /> Support Tickets</span>} value={719} width={385} />
        <DashboardCard title={<span><RetweetOutlined /> Categories</span>} value={4} width={385} />
        <DashboardCard title={<span><AreaChartOutlined /> Levels</span>}value={5} width={385} />
        <DashboardCard title={<span><TeamOutlined /> Customers</span>} value={121} width={385} />
      </Space>
      <Space>
      <RecentOrders />
      </Space>
    </Space>
  );
}

function DashboardCard({ title, value, width }) {
  return (
    <Card style={{ width }}>
      <Space direction="horizontal">
        <Statistic title={title} value={value} />
      </Space>
    </Card>
  );
}

function RecentOrders() {
  const [dataSource, setDataSource] = useState(() => {
    const data = JSON.parse(localStorage.getItem('dashboardData'));
    if (data) {
      return data;
    }
    return [];
  });
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [recordsUpdated, setRecordsUpdated] = useState(false);
  const [bulkSelect, setBulkSelect] = useState(false);

  useEffect(() => {
    if (!dataSource.length) {
      setLoading(true);
      getTicketDates()
        .then((res) => {
          const formattedData = res.map((ticket) => {
            const date = moment(ticket.Date, "M/D/YYYY H:mm").fromNow();
            return {
              key: ticket.Identity,
              identity: ticket.Identity,
              company: ticket.Company,
              message: ticket.Message,
              label: ticket.Label,
              sentiment: ticket.Sentiment,
              date: date,
              date: ticket.Date,
              Urgency: "Not Determined",
              Percentage: "0%",
            };
          });
          setDataSource(formattedData);
          setData(formattedData); // set the data here
          setLoading(false);
          localStorage.setItem('dashboardData', JSON.stringify(formattedData));
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    } else {
      setData(dataSource);
    }
  }, [dataSource]);
  

  const columns = [
    { title: "Customer", dataIndex: "company" },
    {
      title: "Message",
      dataIndex: "message",
      render: (text) => (text.length > 60 ? text.slice(0, 150) + "..." : text),
    },
    {
      title: "Created",
      dataIndex: "date",
      render: (text) => (
        <span className="date-text">{moment(text).fromNow()}</span>
      ),
      sorter: (a, b) => moment(b.date) - moment(a.date),
      defaultSortOrder: "ascend",
    },
    {
      title: "Urgency",
      dataIndex: "Urgency",
      filters: [
        { text: "Low", value: "Low" },
        { text: "Medium", value: "Medium" },
        { text: "High", value: "High" },
        { text: "Extreme", value: "Extreme" },
      ],
      onFilter: (value, record) => record.Urgency === value,
      sorter: (a, b) => {
        const order = ["Extreme", "High", "Medium", "Low"];
        return order.indexOf(a.Urgency) - order.indexOf(b.Urgency);
      },
      render: (text) => {
        let color;
        switch (text) {
          case "Low":
            color = "#52c41a";
            break;
          case "Medium":
            color = "#1890ff";
            break;
          case "High":
            color = "#faad14";
            break;
          case "Extreme":
            color = "#f5222d";
            break;
          default:
            color = "#000000";
            break;
        }
        return (
          <Tag color={color} style={{ fontSize: "12px" }}>
            {text}
          </Tag>
        );
      },
    },
    {
      title: "Percentage",
      dataIndex: "Percentage",
      sorter: (a, b) => {
        const urgencyOrder = ["Extreme", "High", "Medium", "Low"];
        const aUrgencyIndex = urgencyOrder.indexOf(a.Urgency);
        const bUrgencyIndex = urgencyOrder.indexOf(b.Urgency);
        if (aUrgencyIndex < bUrgencyIndex) {
          return -1;
        }
        if (aUrgencyIndex > bUrgencyIndex) {
          return 1;
        }
        if (aUrgencyIndex === bUrgencyIndex) {
          return parseFloat(b.Percentage) - parseFloat(a.Percentage);
        }
      },
      render: (value, record) => {
        const percent = parseFloat(value);
        let strokeColor = "#000000"; // default ash color
        if (record.Urgency === "Low") {
          strokeColor = "#52c41a"; // green color
        } else if (record.Urgency === "Medium") {
          strokeColor = "#1890ff"; // blue color
        } else if (record.Urgency === "High") {
          strokeColor = "#faad14"; // orange color
        } else if (record.Urgency === "Extreme") {
          strokeColor = "#f5222d"; // red color
        } else if (record.Urgency === "Not Determined") {
          strokeColor = "#000000"; // set to ash color
        }
        return (
          <Progress
            type="circle"
            percent={percent}
            width={50}
            strokeColor={strokeColor}
            format={(percent) => (
              <div style={{ color: strokeColor }}>{percent}%</div>
            )}
          />
        );
      },
    },
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Button
          type="default"
          size="medium"
          onClick={() => {
            Modal.info({
              title: "View Support Ticket",
              centered: true,
              width: 600,
              content: (
                <div className="modal-content">
                  <Table
                    dataSource={[
                      {
                        key: "1",
                        label: "Customer",
                        value: record.company,
                      },
                      {
                        key: "2",
                        label: "Message",
                        value: record.message,
                      },
                      {
                        key: "3",
                        label: "Urgency",
                        value: record.Urgency || "Not Determined",
                      },
                      {
                        key: "4",
                        label: "Level",
                        value: record.Urgency ? (
                          <Progress
                            type="circle"
                            percent={parseFloat(
                              record.Percentage.toString().replace("%", "")
                            )}
                            width={100}
                            format={(percent) => `${percent}%`}
                            strokeColor={
                              record.Urgency === "Extreme"
                                ? "red"
                                : record.Urgency === "High"
                                ? "orange"
                                : record.Urgency === "Medium"
                                ? "blue"
                                : record.Urgency === "Low"
                                ? "green"
                                : record.Urgency === "Not Determined"
                                ? "ash"
                                : "gray"
                            }
                          />
                        ) : (
                          "Not Calculated"
                        ),
                      },
                    ]}
                    columns={[
                      {
                        title: "Label",
                        dataIndex: "label",
                        key: "label",
                      },
                      {
                        title: "Value",
                        dataIndex: "value",
                        key: "value",
                      },
                    ]}
                    showHeader={false}
                    pagination={false}
                    bordered={false}
                  />
                </div>
              ),
            });
          }}
        >
          View
        </Button>
      ),
    },
  ];
  

  const onSelectChange = (selectedKeys) => {
    setSelectedRowKeys(selectedKeys);
  };

  const handleDetectUrgency = () => {
    const recordsToUpdate = dataSource.filter((record) =>
      selectedRowKeys.includes(record.key)
    );

    const supportTickets = recordsToUpdate.map((record) => record.message);
    const requestBody = { support_tickets: supportTickets };

    setLoading(true);

    fetch("http://127.0.0.1:5000/predict", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    })
      .then((response) => response.json())
      .then((data) => {
        const updatedRecords = selectedRowKeys.map((key, index) => {
          const record = dataSource.find((r) => r.key === key);
          return {
            ...record,
            Urgency: data[index].class,
            Percentage: `${(data[index].score * 100)
              .toFixed(2)
              .replace(/\.?0*$/, "")}%`,
          };
        });

        const newDataSource = dataSource.map((record) => {
          const updatedRecord = updatedRecords.find((r) => r.key === record.key);
          return updatedRecord || record;
        });

        setDataSource(newDataSource);
        setData(newDataSource); // update data source with the updated data
        setLoading(false);
        // setSelectedRowKeys([]);
        setRecordsUpdated(true); // set recordsUpdated to true
        localStorage.setItem('dashboardData', JSON.stringify(newDataSource));
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const handleViewSummary = () => {
    const updatedRecords = dataSource.filter((record) =>
      data.some((r) => r.key === record.key)
    );
  
    const totalSent = selectedRowKeys.length;
    const extreme = updatedRecords.filter(
      (record) => record.Urgency === "Extreme"
    ).length;
    const high = updatedRecords.filter((record) => record.Urgency === "High").length;
    const medium = updatedRecords.filter(
      (record) => record.Urgency === "Medium"
    ).length;
    const low = updatedRecords.filter((record) => record.Urgency === "Low").length;
  
    const tableData = [
      { category: "Extreme", count: extreme },
      { category: "High", count: high },
      { category: "Medium", count: medium },
      { category: "Low", count: low },
    ];
  
    const columns = [
      {
        title: "Category",
        dataIndex: "category",
      },
      {
        title: "Count",
        dataIndex: "count",
      },
    ];
  
    const summary = `Total Sent: ${totalSent}`;
  
    Modal.info({
      title: "Summary of Updated Records",
      content: (
        <>
          <Table
            columns={columns}
            dataSource={tableData}
            pagination={false}
            style={{ marginBottom: "20px" }}
          />
          <Doughnut
            data={{
              labels: tableData.map((dataPoint) => dataPoint.category),
              datasets: [
                {
                  data: tableData.map((dataPoint) => dataPoint.count),
                  backgroundColor: [
                    "#f5222d", // red for "Extreme"
                    "#faad14", // orange for "High"
                    "#1890ff", // blue for "Medium"
                    "#52c41a", // green for "Low"
                  ],
                },
              ],
            }}
          />
          <p>{summary}</p>
        </>
      ),
      onOk() {},
    });
  };

  const onSelectAll = (selected, selectedRows, changeRows) => {
    const allRowKeys = dataSource.map((item) => item.key);
    setSelectedRowKeys(selected ? allRowKeys : []);
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
    onSelectAll,
  };

  const categorizeSummary = () => {
    const updatedRecords = dataSource.filter((record) =>
      data.some((r) => r.key === record.key)
    );
  
    const totalSent = selectedRowKeys.length;
    const extreme = updatedRecords.filter(
      (record) => record.Urgency === "Extreme"
    ).length;
    const high = updatedRecords.filter((record) => record.Urgency === "High").length;
    const medium = updatedRecords.filter(
      (record) => record.Urgency === "Medium"
    ).length;
    const low = updatedRecords.filter((record) => record.Urgency === "Low").length;
  
    const tagColors = {
      "Extreme": "red",
      "High": "orange",
      "Medium": "blue",
      "Low": "green"
    };
  
    const summaryData = [
      {
        key: "1",
        category: (
          <span>
            <Tag color={tagColors["Extreme"]} size="large">Extremely Urgent</Tag>
          </span>
        ),
        count: (
          <span>
            <Tag color={tagColors["Extreme"]} size="large">{extreme}</Tag>
          </span>
        ),
      },
      {
        key: "2",
        category: (
          <span>
            <Tag color={tagColors["High"]} size="large">Highly Urgent</Tag>
          </span>
        ),
        count: (
          <span>
            <Tag color={tagColors["High"]} size="large">{high}</Tag>
          </span>
        ),
      },
      {
        key: "3",
        category: (
          <span>
            <Tag color={tagColors["Medium"]} size="large">Somewhat Urgent</Tag>
          </span>
        ),
        count: (
          <span>
            <Tag color={tagColors["Medium"]} size="large">{medium}</Tag>
          </span>
        ),
      },
      {
        key: "4",
        category: (
          <span>
            <Tag color={tagColors["Low"]} size="large">Not Urgent</Tag>
          </span>
        ),
        count: (
          <span>
            <Tag color={tagColors["Low"]} size="large">{low}</Tag>
          </span>
        ),
      },
    ];
  
    Modal.info({
      title: "Categorization Summary",
      content: (
        <Table
          columns={[
            {
              title: "Category",
              dataIndex: "category",
              key: "category",
            },
            {
              title: "Count",
              dataIndex: "count",
              key: "count",
            },
          ]}
          dataSource={summaryData}
          bordered
          pagination={false}
          footer={() => (
            <div style={{ paddingTop: "1rem" }}>
              <Tag color="default" size="large">Total Support Tickets:</Tag> <Tag color="default" size="large">{totalSent}</Tag>
            </div>
          )}
        />
      ),
      onOk() {},
    });
  };

  const handleBulkSelect = () => {
    setBulkSelect(!bulkSelect);
    if (!bulkSelect) {
      const allRowKeys = dataSource.map((item) => item.key);
      setSelectedRowKeys(allRowKeys);
    } else {
      setSelectedRowKeys([]);
    }
  };

  const handleResetCalculation = () => {
    const defaultData = dataSource.map((ticket) => {
      return {
        ...ticket,
        Urgency: "Not Determined",
        Percentage: "0%",
      };
    });
    setDataSource(defaultData);
    setData(defaultData);
  };
  
  return (
    <>
      <Typography.Title level={4}>Recent Support Requests</Typography.Title>

      <Button style={{ marginLeft: "1px" }} onClick={handleBulkSelect}>
        {bulkSelect ? "Bulk Deselect" : "Bulk Select"}
      </Button>

      {
        <Button
          type="default"
          size="medium"
          style={{
            marginTop: "10px",
            marginBottom: "20px",
            marginLeft: "10px",
          }}
          onClick={handleDetectUrgency}
        >
          Quick Categorization
        </Button>
      }
      <Button style={{ marginLeft: "10px" }} onClick={handleViewSummary}>
        Visualize Urgency Chart
      </Button>

      <Button style={{ marginLeft: "10px" }} onClick={categorizeSummary}>
        Categorization Summary
      </Button>

      <Button style={{ marginLeft: "10px" }} onClick={handleResetCalculation}>
        Reset Calculation
      </Button>

      <Spin spinning={loading} tip="Determining urgency...">
        <Table
          columns={columns}
          dataSource={dataSource}
          pagination={{
            pageSize: 5,
          }}
          rowSelection={rowSelection}
          rowKey="key"
        />
      </Spin>
    </>
  );
}

export default Dashboard;
