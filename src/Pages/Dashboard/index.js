import { Typography , Space, Card, Statistic, Table} from "antd";
import { PieChartOutlined, BarChartOutlined, FallOutlined, SlidersOutlined} from "@ant-design/icons";
import { useEffect, useState } from "react";
import { getCustomers, getSupportTickets, getOrders, getRevenue } from "../../API";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);



function Dashboard() {

  const [orders, setOrders] = useState(0)
  const [supportTickets, setSupportTickets] = useState(0)
  const [customers, setCustomers] = useState(0)
  const [revenue, setRevenue] = useState(0)

  useEffect(() => {
    getOrders().then(res=>{
      setOrders(res.total);
    });
    getSupportTickets().then(res=>{
      setSupportTickets(res.total);
    });
    getCustomers().then(res=>{
      setCustomers(res.total);
    });
    getRevenue().then(res=>{
      setRevenue(res.total);
    });
  }, [])

  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}> Dashboard </Typography.Title>
      <Space direction="horizontal">
        <DashboardCard icon={<PieChartOutlined style={{color:"gray", backgroundColor:'rgba(0,255,0,0.25)', borderRadius: 20, fontSize: 24, padding: 8}} />} title={"Support Tickets"} value={orders}/>
        <DashboardCard icon={<BarChartOutlined style={{color:"purple", backgroundColor:'rgba(0,255,255,0.25)', borderRadius: 20, fontSize: 24, padding: 8}} />} title={"Categories"} value={supportTickets}/>
        <DashboardCard icon={<FallOutlined style={{color:"red", backgroundColor:'rgba(255,0,0,0.25)', borderRadius: 20, fontSize: 24, padding: 8}} />} title={"Percentages"} value={customers}/>
        <DashboardCard icon={<SlidersOutlined style={{color:"blue", backgroundColor:'rgba(0,0,255,0.25)', borderRadius: 20, fontSize: 24, padding: 8}} />} title={"Customers"} value={revenue}/>
      </Space>
      <Space>
        <RecentOrders />
        <DashboardChart />
      </Space>
    </Space>
  );
}

function DashboardCard({title, value, icon}){
  return(
    <Card>
    <Space direction="horizontal">
      {icon}
      <Statistic title={title} value={value}/>
      </Space>
    </Card>
  )
}

function RecentOrders() {

  const [dataSource, setDataSource] = useState([])
  const [loading, setLoading] = useState([false])

  useEffect(() => {
    setLoading(true) 
    getOrders().then(res=>{
      setDataSource(res.products.splice(0, 5));
      setLoading(false);
    });
    
  }, []);

  return (
    <>
    <Typography.Title level={4}>Recent Support Requests</Typography.Title>
    <Table
      columns=
      {[
        {
          title: "Customer",
          dataIndex: "title",
        },
        {
          title: "Message",
          dataIndex: "quantity",
        },
        {
          title: "Urgency",
          dataIndex: "discountedPrice",
        },
        {
          title: "Percentage",
          dataIndex: "discountPercentage",
        },
      ]}
      loading={loading}
      dataSource={dataSource}
      pagination={false}
    ></Table>
    </>
  );
}

function DashboardChart() {
  const [revenueData, setReveneueData] = useState({
    labels: [],
    datasets: [],
  });

  useEffect(() => {
    getRevenue().then((res) => {

      const labels = res.carts.map((cart) => {
        return `User-${cart.userId}`;
      });

      const data = res.carts.map((cart) => {
        return cart.discountedTotal;
      });

      const dataSource = {
        labels,
        datasets: [
          {
            label: "Revenue",
            data: data,
            backgroundColor: "rgba(255, 0, 0, 1)",
          },
        ],
      };

      setReveneueData(dataSource);
    });
  }, []);

  const options = {
    responsive: true,
    plugins: {
      legend: {
        position: "bottom",
      },
      title: {
        display: true,
        text: "Urgency Calculation",
      },
    },
  };

  return (
    <Card style={{ width: 500, height: 250 }}>
      <Bar options={options} data={revenueData} />
    </Card>
  );
}

export default Dashboard;
