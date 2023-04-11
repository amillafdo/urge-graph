import {
  Avatar,
  Button,
  Rate,
  Space,
  Table,
  Typography,
  message,
  Progress,
  Modal 
} from "antd";
import { getDataTickets } from "../../API";
import { useEffect, useState} from "react";
import axios from "axios";
import { Bar } from 'react-chartjs-2';


function SupportTickets() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  useEffect(() => {
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
          };
        });
        setDataSource(formattedData);
        setLoading(false);
      })
      .catch((err) => {
        console.log(err);
        setLoading(false);
      });
  }, []);

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
        setDataSource([...updatedDataSource]); // create a new copy of the modified array
      })
      .catch((error) => {
        setLoading(false);
        message.error("Failed to determine urgency");
        console.log(error);
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
        const sentCount = dataSource.filter((item) => item.Urgency !== "Not Determined").length;
      
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
              label: 'Count',
              data: [urgencySummary.Low, urgencySummary.Medium, urgencySummary.High, urgencySummary.Extreme],
              backgroundColor: ['#00FF00', '#0000FF', '#FFA500', '#FF0000'],
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
              position: 'bottom',
            },
            title: {
              display: true,
              text: 'Urgency Summary',
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
          width: 600
        });
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
        {dataSource.some((item) => item.Urgency !== "Not Determined") && (
          <Button onClick={handleViewSummary}>View Summary</Button>
        )}
      </Space>
      <Table
        loading={loading}
        columns={columns}
        dataSource={dataSource}
        pagination={{
          pageSize: 10,
        }}
        rowSelection={rowSelection}
      ></Table>
    </Space>
  );
}

export default SupportTickets;
