import { Avatar, Rate, Space, Table, Typography } from "antd";
import { getSupportTickets } from "../../API";
import { useEffect, useState } from "react";

function SupportTickets() {

  const [loading, setLoading] = useState(false) 
  const [dataSource, setDataSource] = useState([])

  useEffect(() => {

    setLoading(true)

    getSupportTickets().then(res=>{
      setDataSource(res.products);
      setLoading(false);
    })
    
  }, [])


  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}> Support Tickets </Typography.Title>
      <Table
      loading={loading}
       columns={[
      {
          title:"Thumbnail",
          dataIndex:"thumbnail",
          render:(link)=>{
            return <Avatar src={link}/>;
          }
      },
      {
        title:"Customer",
        dataIndex:"title"
      },
      {
        title:"Message",
        dataIndex:"description"
      },
      {
        title:"Urgency",
        dataIndex:"category"
      },
      {
        title:"Percentage",
        dataIndex:"rating",
        render: (rating) => {
          return <Rate value={rating} allowHalf disabled/>
        }
      },
      {
        title:"Brand",
        dataIndex:"brand"
      },
      {
        title:"Category",
        dataIndex:"stock"
      },
        ]}
      dataSource={dataSource}
      pagination={{
        pageSize:10
      }}
        ></Table>
    </Space>
  );
}

export default SupportTickets;
