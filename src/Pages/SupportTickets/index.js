import { Button, Space, Table, Typography, message, Progress, Modal, Switch, Spin, Badge, Tag } from "antd";
import { getDataTickets } from "../../API";
import { useEffect, useState } from "react";
import axios from "axios";
import { Bar } from "react-chartjs-2";
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

function SupportTickets() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState(() => {
    const data = JSON.parse(localStorage.getItem('supportTicketsData'));
    if (data) {
      return data;
    }
    return [];
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [data, setData] = useState([]);
  const [resetButtonVisible, setResetButtonVisible] = useState(false);


  useEffect(() => {
    if (!dataSource.length) {
      setLoading(true);
      getDataTickets()
        .then((res) => {
          const formattedData = res.map((ticket) => {
            return {
              key: ticket.Identity,
              identity: ticket.Identity,
              company: ticket.Company,
              message: ticket.Message,
              label: ticket.Label,
              sentiment: ticket.Sentiment,
              Urgency: "Not Determined",
              Percentage: "0%",
              toggle: false // set the toggle property here
            };
          });
          setDataSource(formattedData);
          setData(formattedData); // set the data here
          setLoading(false);
          localStorage.setItem('supportTicketsData', JSON.stringify(formattedData));
        })
        .catch((err) => {
          console.log(err);
          setLoading(false);
        });
    } else {
      // check if there are any rows with urgency already determined
      const anyUrgencyDetermined = dataSource.some((item) => item.Urgency !== "Not Determined" && item.Urgency !== "Unknown");
      const anyPercentageDetermined = dataSource.some((item) => item.Percentage !== "0%");
      if (selectedRowKeys.length > 0 && anyUrgencyDetermined && anyPercentageDetermined) {
        setResetButtonVisible(true);
      } else {
        setResetButtonVisible(false);
      }
    }
  }, [dataSource, selectedRowKeys]);
  

  const handleToggle = (checked, record) => {
    const newData = [...dataSource];
    const index = newData.findIndex((item) => record.key === item.key);
    if (index > -1) {
      newData[index].toggle = checked;
      setDataSource(newData);
    }
  };

  const handleDetermineUrgency = () => {
    const selectedRows = dataSource.filter((item) =>
      selectedRowKeys.includes(item.key)
    );
    const messages = selectedRows.map((item) => item.message);
    setLoading(true);
    axios
      .post("http://127.0.0.1:5000/predict", {
        support_tickets: messages,
      })
      .then((response) => {
        setLoading(false);
        message.success("Urgency determined successfully");
        const predictedValues = response.data;
        const updatedDataSource = dataSource.map((item, index) => {
          const matchingRow = selectedRows.find((row) => row.key === item.key);
          if (matchingRow) {
            const predictedValue =
              predictedValues[selectedRows.length > 1 ? index : 0];
            if (predictedValue) {
              return {
                ...item,
                Urgency: predictedValue.class,
                Percentage: Math.round(predictedValue.score * 100),
              };
            } else {
              return {
                ...item,
                Urgency: "Unknown",
                Percentage: 0,
              };
            }
          }
          return item;
        });
        setDataSource([...updatedDataSource]);
        setResetButtonVisible(true);
        localStorage.setItem('supportTicketsData', JSON.stringify(updatedDataSource));
      })
      .catch((error) => {
        setLoading(false);
        message.error("Failed to determine urgency");
        console.log(error);
      });
  };

  const handleViewModal = (record) => {
    Modal.info({
      title: "Ticket Details",
      content: (
        <div>
          <p>
            <b>Ticket Id:</b> {record.identity}
          </p>
          <p>
            <b>Customer:</b> {record.company}
          </p>
          <p>
            <b>Message:</b> {record.message}
          </p>
          <p>
            <b>Urgency:</b> {record.Urgency}
          </p>
          <p>
            <b>Percentage:</b>
            <Progress
              type="circle"
              percent={parseFloat(record.Percentage)}
              width={50}
              strokeColor={
                record.Urgency === "Low" ? "green" :
                record.Urgency === "Medium" ? "blue" :
                record.Urgency === "High" ? "orange" : "red"
              }
            />
          </p>
        </div>
      ),
      onOk() {},
    });
  };

  const columns = [
    {
      title: "Ticket Id",
      dataIndex: "identity",
      width: 100,
    },
    {
      title: "Customer",
      dataIndex: "company",
    },
    {
      title: "Message",
      dataIndex: "message",
      render: (text) => <div title={text}>{text.slice(0, 150)}...</div>,
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
            color = "green";
            break;
          case "Medium":
            color = "blue";
            break;
          case "High":
            color = "orange";
            break;
          case "Extreme":
            color = "red";
            break;
          default:
            color = "gray";
            break;
        }
        return <Tag color={color}>{text}</Tag>;
      },
    },
    {
      title: "Percentage",
      dataIndex: "Percentage",
      sorter: (a, b) => {
        const order = ["Extreme", "High", "Medium", "Low", "Not Determined"];
        const aOrder = order.indexOf(a.Urgency);
        const bOrder = order.indexOf(b.Urgency);
        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }
        return parseFloat(b.Percentage) - parseFloat(a.Percentage);
      },
      filters: [
        { text: "Extreme", value: "Extreme" },
        { text: "High", value: "High" },
        { text: "Medium", value: "Medium" },
        { text: "Low", value: "Low" },
        { text: "Not Determined", value: "Not Determined" },
      ],
      onFilter: (value, record) => record.Urgency === value,
      render: (value, record) => {
        const percent = parseFloat(value);
        let strokeColor = "ash"; // default ash color
        if (record.Urgency === "Low") {
          strokeColor = "green"; // green color
        } else if (record.Urgency === "Medium") {
          strokeColor = "blue"; // blue color
        } else if (record.Urgency === "High") {
          strokeColor = "orange"; // orange color
        } else if (record.Urgency === "Extreme") {
          strokeColor = "red"; // red color
        } else if (record.Urgency === "Not Determined") {
          strokeColor = "ash"; // set to ash color
        }
        return (
          <Progress
            type="circle"
            percent={percent}
            width={50}
            strokeColor={strokeColor}
            format={(percent) => (
              <div style={{ color: strokeColor }}>
                {percent}%
              </div>
            )}
          />
        );
      },
    },    
    {
      title: "Action",
      dataIndex: "action",
      render: (_, record) => (
        <Button onClick={() => handleViewModal(record)}>View</Button>
      ),
    },
    ,
    {
      title: "Remark",
      dataIndex: "toggle",
      render: (value, record) => (
        <Switch
          checked={value}
          onChange={(checked) => handleToggle(checked, record)}
        />
      ),
    }  
  ];

  const rowSelection = {
    type: "checkbox",
    selectedRowKeys,
    onChange: (selectedRowKeys, selectedRows) => {
      setSelectedRowKeys(selectedRowKeys);
      console.log(selectedRowKeys, selectedRows);
    },
  };

  const handleSelectAll = () => {
    if (selectedRowKeys.length === dataSource.length) {
      setSelectedRowKeys([]);
    } else {
      const allKeys = dataSource.map((item) => item.key);
      setSelectedRowKeys(allKeys);
    }
  };

  const selectButtonName =
    selectedRowKeys.length === dataSource.length
      ? "Bulk Deselect"
      : "Bulk Select";

  const handleViewSummary = () => {
    const sentCount = dataSource.filter(
      (item) => item.Urgency !== "Not Determined"
    ).length;

    const urgencySummary = dataSource.reduce(
      (summary, item) => {
        if (item.Urgency !== "Not Determined") {
          if (summary[item.Urgency]) {
            summary[item.Urgency]++;
          } else {
            summary[item.Urgency] = 1;
          }
        }
        return summary;
      },
      { Low: 0, Medium: 0, High: 0, Extreme: 0 }
    );

    const data = {
      labels: ["Low", "Medium", "High", "Extreme"],
      datasets: [
        {
          label: "Count",
          data: [
            urgencySummary.Low,
            urgencySummary.Medium,
            urgencySummary.High,
            urgencySummary.Extreme,
          ],
          backgroundColor: ["#00FF00", "#0000FF", "#FFA500", "#FF0000"],
        },
      ],
    };

    const options = {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
        },
      },
      plugins: {
        legend: {
          position: "bottom",
        },
        title: {
          display: true,
          text: "Urgency Summary",
        },
      },
    };

    Modal.info({
      title: "Urgency Summary",
      content: (
        <div>
          <p>
            Total Sent: <strong>{sentCount}</strong>
          </p>
          <Bar data={data} options={options} />
        </div>
      ),
      width: 600,
    });
  };

  const handleCategorizationSummary = () => {
    const selectedRows = dataSource.filter((item) =>
      selectedRowKeys.includes(item.key)
    );
  
    const sortedRows = selectedRows.sort((a, b) => {
      const urgencyMap = { Extreme: 0, High: 1, Medium: 2, Low: 3 };
      return urgencyMap[a.Urgency] - urgencyMap[b.Urgency];
    });
    const columns = [
      {
        title: "Ticket Id",
        dataIndex: "identity",
        width: 120,
      },
      {
        title: "Customer",
        dataIndex: "company",
      },
      {
        title: "Message",
        dataIndex: "message",
        render: (text) => <div title={text}>{text.slice(0, 30)}...</div>,
      },
      {
        title: "Urgency",
        dataIndex: "Urgency",
      },
      {
        title: "Percentage",
        dataIndex: "Percentage",
        render: (value, record) => {
          const percent = parseFloat(value);
          let strokeColor = "ash"; // default green color
          if (record.Urgency === "Low") {
            strokeColor = "green"; // green color
          } else if (record.Urgency === "Medium") {
            strokeColor = "blue"; // yellow color
          } else if (record.Urgency === "High") {
            strokeColor = "orange"; // orange color
          } else if (record.Urgency === "Extreme") {
            strokeColor = "red"; // red color
          }
          return (
            <Progress
              type="circle"
              percent={percent}
              width={50}
              strokeColor={strokeColor}
            />
          );
        },
      },
    ];
    
  
    Modal.info({
      title: "Categorization Summary",
      content: (
        <Table dataSource={sortedRows} columns={columns} pagination={{ pageSize: 5 }} />
      ),
      width: 800,
    });
  };

  const handleResetValues = () => {
    const selectedKeys = selectedRowKeys.map((key) => key.toString());
    const updatedDataSource = dataSource.map((item) => {
      if (selectedKeys.includes(item.key.toString())) {
        return {
          ...item,
          Urgency: "Not Determined",
          Percentage: "0%",
        };
      }
      return item;
    });
    setDataSource(updatedDataSource);
    setResetButtonVisible(false);
  };
  
  return (
    <Space size={20} direction="vertical">
    <Typography.Title level={4}>Support Backlog</Typography.Title>
    <Space>
      <Button onClick={handleSelectAll}>{selectButtonName}</Button>
      <Button
        onClick={handleDetermineUrgency}
        disabled={selectedRowKeys.length === 0 || loading}
        loading={loading}
      >
        Determine Urgency
      </Button>
      <Button onClick={handleResetValues} disabled={!resetButtonVisible}>
        Reset Calculation
      </Button>
      {dataSource.some((item) => item.Urgency !== "Not Determined") && (
        <Button onClick={handleViewSummary}>View Summary</Button>
      )}
      {selectedRowKeys.length > 0 && (
        <Button onClick={handleCategorizationSummary}>
          Categorization Summary
        </Button>
      )}
    </Space>
    <Spin spinning={loading} tip="Determining urgency...">
      <Table
        columns={columns}
        dataSource={dataSource}
        pagination={{
          pageSize: 6,
        }}
        rowSelection={rowSelection}
      ></Table>
    </Spin>
  </Space>  
  );
}

export default SupportTickets;
