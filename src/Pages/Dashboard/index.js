import { Typography, Space, Card, Statistic, Table, Button, List } from "antd";
import { useEffect, useState, useRef  } from "react";
import { Doughnut } from 'react-chartjs-2';
import { v4 as uuidv4 } from "uuid";
import moment from "moment";
import {
  getCustomers,
  getSupportTickets,
  getOrders,
  getRevenue,
  getTicketDates,
} from "../../API";

function Dashboard() {
  const [orders, setOrders] = useState(0);
  const [supportTickets, setSupportTickets] = useState(0);
  const [customers, setCustomers] = useState(0);
  const [revenue, setRevenue] = useState(0);

  useEffect(() => {
    getOrders().then((res) => {
      setOrders(res.total);
    });
    getSupportTickets().then((res) => {
      setSupportTickets(res.total);
    });
    getCustomers().then((res) => {
      setCustomers(res.total);
    });
    getRevenue().then((res) => {
      setRevenue(res.total);
    });
  }, []);

  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}> Dashboard </Typography.Title>
      <Space direction="horizontal">
        <DashboardCard title={"Support Tickets"} value={orders} width={310} />
        <DashboardCard title={"Categories"} value={supportTickets} width={310} />
        <DashboardCard title={"Percentages"} value={customers} width={310} />
        <DashboardCard title={"Customers"} value={revenue} width={310} />
      </Space>
      <Space>
      <RecentOrders />
      <GraphCard title={"Urgency Summary"} />
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

function GraphCard({ title }) {
  const data = {
    labels: ['Extreme', 'High', 'Medium', 'Low'],
    datasets: [
      {
        label: 'Support Tickets',
        data: [20, 40, 60, 80],
        backgroundColor: [
          'rgb(255, 99, 132)',
          'rgb(54, 162, 235)',
          'rgb(255, 205, 86)',
          'rgb(75, 192, 192)',
        ],
        hoverOffset: 4,
      },
    ],
  };

  return (
    <Card>
      <Typography.Title level={4}>{title}</Typography.Title>
      <Doughnut data={data} />
      <div style={{ marginTop: 20 }}>
        <Typography.Text strong>Total Support Tickets: </Typography.Text>
        <br />
        <Typography.Text>Extreme: 20</Typography.Text>
        <br />
        <Typography.Text>High: 40</Typography.Text>
        <br />
        <Typography.Text>Medium: 60</Typography.Text>
        <br />
        <Typography.Text>Low: 80</Typography.Text>
      </div>
    </Card>
  );
}



function RecentOrders() {
  const [dataSource, setDataSource] = useState([]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

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
      render: (text) => (text.length > 60 ? text.slice(0, 60) + "..." : text),
    },
    {
      title: "Created",
      dataIndex: "date",
      render: (text) => moment(text).fromNow(),
      sorter: (a, b) => moment(b.date) - moment(a.date),
      defaultSortOrder: "ascend",
    },
    { title: "Urgency", dataIndex: "Urgency" },
    { title: "Percentage", dataIndex: "Percentage" },
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
        setSelectedRowKeys([]);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const rowSelection = {
    selectedRowKeys,
    onChange: onSelectChange,
  };

  return (
    <>
      <Typography.Title level={4}>Recent Support Requests</Typography.Title>
      {(
        <Button
          type="default"
          size="medium"
          style={{ marginBottom: "16px" }}
          onClick={handleDetectUrgency} // add this line
        >
          Quick Categorization
        </Button>
      )}
      <Table
        columns={columns}
        loading={loading}
        dataSource={dataSource}
        pagination={{
          pageSize: 6,
        }}
        rowSelection={rowSelection}
      />
    </>
  );
}

export default Dashboard;
