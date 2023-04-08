import { Button, Space, Table, Typography, Upload, Progress, Spin, Modal, Checkbox } from "antd";
import { useState, useEffect, useRef } from "react";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

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
        const tableData = results.data.map((row) => {
          return {
            key: uuidv4(),
            customer: row.Company,
            message: row.Message,
            label: "Not Determined",
            sentiment: "Not Calculated",
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

  const handleResetCalculation = () => {
    const updatedData = dataSource.map((row) => {
      const index = selectedRows.findIndex(
        (selectedRow) => selectedRow.key === row.key
      );
      if (index !== -1) {
        return {
          ...row,
          label: "",
          sentiment: "",
        };
      }
      return row;
    });
    setDataSource(updatedData);
    setShowResetButton(false);
  };

  const onSelectChange = (selectedRowKeys, selectedRows) => {
    setSelectedRows(selectedRows);
  };

  const determineUrgency = () => {
    const selectedMessages = selectedRows.map((row) => row.message);
    const requestBody = { support_tickets: selectedMessages };

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
        const updatedData = dataSource.map((row) => {
          const index = selectedRows.findIndex(
            (selectedRow) => selectedRow.key === row.key
          );
          if (index !== -1) {
            return {
              ...row,
              label: data[index].class,
              sentiment: `${(data[index].score * 100).toFixed(2)}%`,
            };
          }
          return row;
        });
        setDataSource(updatedData);
        setLoading(false);
        setShowResetButton(true);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const handleBulkSelect = () => {
    const allRowKeys = dataSource.map((row) => row.key);
    if (!selectAll) {
      setSelectedRows(dataSource);
    } else {
      setSelectedRows([]);
    }
    setSelectAll(!selectAll);
  
    if (tableRef.current) {
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
        return "#52c41a"; // green
      case "Low":
        return "#1890ff"; // blue
      default:
        return "#000000"; // black
    }
  };

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
        {resetCalculationButton}
        {dataSource.length > 0 && bulkSelectButton}
      </Space>
      <Spin spinning={loading}>
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
                <span>{text ? text.substr(0, 100) : ""}...</span>
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
              render: (text) => <span>{text || "Not Determined"}</span>,
            },
            {
              title: "Percentage",
              dataIndex: "sentiment",
              render: (text, record) => {
                if (!text) {
                  return <span>Not Calculated</span>;
                }

                const percent = parseFloat(text.replace("%", ""));
                const label = record.label;
                const color = determineColor(label);

                return (
                  <Progress
                    percent={percent}
                    strokeColor={color}
                    format={(percent) => `${percent}%`}
                  />
                );
              },
            },
            {
              title: "Action",
              dataIndex: "action",
              render: (_, record) => (
                <Button
                  className="view-button"
                  type="primary"
                  size="small"
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
                              "Not Calculated"
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
            pageSize: 10,
            preserveSelectedRowKeys: true, // add this prop
          }}
        />
      </Spin>
    </Space>
  );
}

export default UrgencyLevels;
