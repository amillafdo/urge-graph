import { Button, Space, Table, Typography, Upload, Progress, Spin, Modal, Tag  } from "antd";
import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";
import { Bar } from 'react-chartjs-2';

function UrgencyLevels() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState(
    JSON.parse(localStorage.getItem("dataSource")) || []
  );
  const [resetTable, setResetTable] = useState(false);
  const [selectedRows, setSelectedRows] = useState([]);
  const [showResetButton, setShowResetButton] = useState(false);
  const [selectAll, setSelectAll] = useState(false);
  const tableRef = useRef(null);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [tableUpdated, setTableUpdated] = useState(
    localStorage.getItem('tableUpdated') === 'true' ? true : false
  );

  useEffect(() => {
    // Get the visibility of the reset button from local storage
    const isResetButtonVisible = localStorage.getItem('isResetButtonVisible') === 'true';
    setShowResetButton(isResetButtonVisible);
  }, []);

  useEffect(() => {
    localStorage.setItem("dataSource", JSON.stringify(dataSource));
  }, [dataSource]);


  const handleFileUpload = (file) => {
    setLoading(true);

    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const tableData = results.data
        .filter((row) => row.Company) // filter out empty rows
        .map((row) => {
          return {
            key: uuidv4(),
            customer: row.Company,
            message: row.Message,
            label: "Not Determined",
            sentiment: "0%",
          };
        });
      
        setDataSource(tableData);
        setLoading(false);
        setResetTable(true);
      },
      error: (error) => {
        console.log(error);
        setLoading(false);
        setResetTable(false);
      },
    });
  };

  const handleResetTable = () => {
    if (dataSource.length > 0) {
      setResetTable(!resetTable);
      setDataSource([]);
      setSelectedRows([]);
      localStorage.removeItem("dataSource");
    }
  };

  const [shouldShowResetButton, setShouldShowResetButton] = useState(false);

  const handleResetCalculation = () => {
    const hasChanged = selectedRows.some(
      (selectedRow) =>
        selectedRow.label !== "" || selectedRow.sentiment !== "0%"
    );
    const updatedData = dataSource.map((row) => {
      const index = selectedRows.findIndex(
        (selectedRow) => selectedRow.key === row.key
      );
      if (index !== -1) {
        return {
          ...row,
          label: "",
          sentiment: "0%",
        };
      }
      return row;
    });
    setDataSource(updatedData);
    setShouldShowResetButton(false);
  };
  
  useEffect(() => {
    const hasChanged = selectedRows.some(
      (selectedRow) =>
        selectedRow.label !== "" || selectedRow.sentiment !== "0%"
    );
    setShouldShowResetButton(hasChanged);
  }, [selectedRows]);

  const onSelectChange = (selectedRowKeys, selectedRows) => {
    setSelectedRows(selectedRows);
  };

  const determineUrgency = () => {
    const recordsToUpdate = selectedRows.length > 0 ? selectedRows : dataSource;
  
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
        const updatedRecords = recordsToUpdate.map((record, index) => {
          return {
            ...record,
            label: data[index].class,
            sentiment: `${(data[index].score * 100)
              .toFixed(2)
              .replace(/\.?0*$/, "")}%`,
          };
        });
  
        const newDataSource = dataSource.map((record) => {
          const updatedRecord = updatedRecords.find((r) => r.key === record.key);
          return updatedRecord || record;
        });
  
        setDataSource(newDataSource);
        setLoading(false);
        setShowResetButton(true);
        setTableUpdated(true); // set the state variable to true after updating the table
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const handleBulkSelect = () => {
    if (!selectAll) {
      setSelectedRows((prevSelectedRows) => [      ...prevSelectedRows,      ...dataSource.filter((row) => !prevSelectedRows.includes(row)),    ]);
    } else {
      setSelectedRows([]);
    }
    setSelectAll(!selectAll);
  
    if (tableRef.current) {
      const allRowKeys = dataSource.map((row) => row.key);
      tableRef.current.state.selectionDirty = true;
      tableRef.current.setState({ selectedRowKeys: allRowKeys });
    }
  };
  
  
  const bulkSelectButton = (
    <Button onClick={handleBulkSelect}>
      {selectAll || selectedRows.length === dataSource.length
        ? "Deselect All"
        : selectedRows.length > 0
        ? "Deselect All"
        : "Select All"}
    </Button>
  );

  const determineUrgencyButton = selectedRows.length > 0 && (
    <Button onClick={determineUrgency} loading={loading}>
      Determine Urgency
    </Button>
  );

  const resetCalculationButton =
    showResetButton && dataSource.length > 0 ? (
      <Button onClick={handleResetCalculation}>Reset Calculation</Button>
    ) : null;

  const determineColor = (label) => {
    switch (label) {
      case "Extreme":
        return "#f5222d"; // red
      case "High":
        return "#faad14"; // yellow
      case "Medium":
        return "#1890ff"; // green
      case "Low":
        return "#52c41a"; // blue #52c41a
      default:
        return "#000000"; // black
    }
  };

  const handleViewSummary = () => {
    const updatedRecords = dataSource.filter(
      (record) => record.label !== undefined
    );
    const totalUpdated = selectedRows.filter(
      (record) => record.label !== undefined
    ).length;
    const extremeUpdated = updatedRecords.filter(
      (record) => record.label === "Extreme"
    ).length;
    const highUpdated = updatedRecords.filter(
      (record) => record.label === "High"
    ).length;
    const mediumUpdated = updatedRecords.filter(
      (record) => record.label === "Medium"
    ).length;
    const lowUpdated = updatedRecords.filter(
      (record) => record.label === "Low"
    ).length;

    const data = {
      labels: ["Extreme", "High", "Medium", "Low"],
      datasets: [
        {
          label: "Summary of Updated Records",
          data: [extremeUpdated, highUpdated, mediumUpdated, lowUpdated],
          backgroundColor: [
            "#f5222d",
            "#faad14",
            "#1890ff",
            "#52c41a",
          ],
          borderColor: [
            "#f5222d",
            "#faad14",
            "#1890ff",
            "#52c41a",
          ],
          borderWidth: 1,
        },
      ],
    };

    const options = {
      scales: {
        yAxes: [
          {
            ticks: {
              beginAtZero: true,
            },
          },
        ],
      },
    };

    Modal.info({
      title: "Summary of Updated Records",
      width: 800, // adjust the width of the modal as desired
      maxWidth: "90vw", // adjust the maximum width of the modal as desired
      content: (
        <div>
          <p>Total: {totalUpdated}</p>
          <Bar data={data} options={options} />
        </div>
      ),
      onOk() {
        localStorage.setItem("tableUpdated", "false");
        setTableUpdated(false);
      },
    });
  };

  

  useEffect(() => {
    localStorage.setItem("tableUpdated", tableUpdated.toString());
  }, [tableUpdated]);
  

  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}>Urgency Levels</Typography.Title>

      <Upload.Dragger
        multiple
        beforeUpload={handleFileUpload}
        accept=".csv,.xlsx"
        onRemove={() => {
          setResetTable(false);
          setDataSource([]);
          setSelectedRows([]);
        }}
      >
        <Button>Upload .CSV or .XLSX Files</Button>
      </Upload.Dragger>

      <Space>
        {dataSource.length > 0 && (
          <Button onClick={handleResetTable}>Reset Table</Button>
        )}
        {determineUrgencyButton}
        {dataSource.length > 0 && shouldShowResetButton && (
          <Button onClick={handleResetCalculation}>Reset Calculation</Button>
        )}
        {dataSource.length > 0 && bulkSelectButton}
        {dataSource.length > 0 && (
        <Button onClick={handleViewSummary}>
          {tableUpdated ? "View Updated Summary" : "View Summary"}
        </Button>
      )}
      </Space>
      <Spin spinning={loading} tip="Determining urgency...">
        <Table
          rowKey="key" // set rowKey to unique key property
          key={resetTable ? "reset" : "table"}
          rowSelection={{
            type: "checkbox",
            selectedRowKeys: selectAll
              ? dataSource.map((row) => row.key)
              : selectedRows.map((row) => row.key),
            onChange: onSelectChange,
            getCheckboxProps: (record) => ({
              disabled: !dataSource.length,
              checked: selectedRows.some((row) => row.key === record.key),
            }),
          }}
          loading={loading}
          columns={[
            {
              title: "Customer",
              dataIndex: "customer",
            },
            {
              title: "Message",
              dataIndex: "message",
              render: (text) => (
                <span>{text ? text.substr(0, 150) : ""}...</span>
              ),
            },
            {
              title: "Urgency",
              dataIndex: "label",
              filters: [
                { text: "Extreme", value: "Extreme" },
                { text: "High", value: "High" },
                { text: "Medium", value: "Medium" },
                { text: "Low", value: "Low" },
                { text: "Not Determined", value: "Not Determined" },
              ],
              onFilter: (value, record) => record.label === value,
              render: (text) => {
                let color = "";
                switch (text) {
                  case "Extreme":
                    color = "#f5222d";
                    break;
                  case "High":
                    color = "#faad14";
                    break;
                  case "Medium":
                    color = "#1890ff";
                    break;
                  case "Low":
                    color = "#52c41a";
                    break;
                  default:
                    color = "#000000";
                    break;
                }
                return (
                  <Tag color={color} key={text}>
                    {text || "Not Determined"}
                  </Tag>
                );
              },
              sorter: (a, b) => {
                const order = ["Extreme", "High", "Medium", "Low"];
                const aIndex = order.indexOf(a.label);
                const bIndex = order.indexOf(b.label);
                return aIndex - bIndex;
              },
            },
            {
              title: "Percentage",
              dataIndex: "sentiment",
              sorter: (a, b) => {
                const urgencyOrder = ["Extreme", "High", "Medium", "Low", "Not Determined"];
                const aUrgencyIndex = urgencyOrder.indexOf(a.label);
                const bUrgencyIndex = urgencyOrder.indexOf(b.label);
                if (aUrgencyIndex !== bUrgencyIndex) {
                  return aUrgencyIndex - bUrgencyIndex;
                } else {
                  const aPercent = parseFloat(String(a.sentiment).replace("%", ""));
                  const bPercent = parseFloat(String(b.sentiment).replace("%", ""));
                  return bPercent - aPercent;
                }
              },
              render: (text, record) => {
                if (!text) {
                  return <span>Not Calculated</span>;
                }
                const percent = parseFloat(String(text).replace("%", ""));
                const label = record.label;
                const color = determineColor(label);
                return (
                  <Progress
                    type="circle"
                    percent={percent}
                    width={50}
                    strokeColor={color}
                    format={(percent) => (
                      <div style={{ color: color }}>{`${percent}%`}</div>
                    )}
                  />
                );
              },
            },
            ,
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
                      centered: true, // Display the modal in the center of the screen
                      width: 600, // Increase the width of the modal
                      content: (
                        <div className="modal-content">
                          <p className="modal-item">
                            <strong>Customer:</strong> {record.customer}
                          </p>
                          <p className="modal-item">
                            <strong>Message:</strong> {record.message}
                          </p>
                          <p className="modal-item">
                            <strong>Urgency:</strong>{" "}
                            {record.label || "Not Determined"}
                          </p>
                          <p className="modal-item">
                            <strong>Level:</strong>{" "}
                            {record.sentiment ? (
                              <Progress
                                percent={parseFloat(
                                  record.sentiment.replace("%", "")
                                )}
                                strokeColor={determineColor(record.label)}
                                format={(percent) => `${percent}%`}
                              />
                            ) : (
                              "0%"
                            )}
                          </p>
                        </div>
                      ),
                    });
                  }}
                >
                  View
                </Button>
              ),
            },
          ]}
          dataSource={dataSource}
          pagination={{
            pageSize: 6,
            preserveSelectedRowKeys: true, // add this prop
          }}
        />
      </Spin>
    </Space>
  );
}

export default UrgencyLevels;
