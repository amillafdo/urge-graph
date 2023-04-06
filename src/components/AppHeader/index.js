import { BellFilled, MailOutlined } from "@ant-design/icons";
import { Image, Space, Typography, Badge, Drawer, List } from "antd";
import { useCallback, useEffect, useState } from "react";
import { getComments, getOrders } from "../../API";
import Item from "antd/es/list/Item";

function AppHeader() {

  const [comments, setComments] = useState([])
  const [orders, setOrders] = useState([])
  const [commentsOpen, setCommentsOpen] = useState(false)
  const [notificationsOpen, setnotificationsOpen] = useState(false)

  useEffect(() => {
    getComments().then(res=>{
      setComments(res.comments);
    });
    getOrders().then(res=>{
      setOrders(res.products);
    });
  }, [])


  return (
    <div className="AppHeader">
      <Image
        width={150}
        src="https://asset.brandfetch.io/idX1cECar6/idgLJNKPqO.png"
      ></Image>
      <Typography.Title>Urgency Dashboard</Typography.Title>
      <Space>
        <Badge count={comments.length} dot>
          <MailOutlined style={{ fontSize: 24 }} 
          onClick={() => {
            setCommentsOpen(true);
          }}/>
        </Badge>
        <Badge count={orders.length}>
          <BellFilled style={{ fontSize: 24 }} 
          onClick={() => {
            setnotificationsOpen(true);
          }}/>
        </Badge>
      </Space>
      <Drawer title="Comments" open={commentsOpen} onClose={() => {
        setCommentsOpen(false)
      }} maskClosable>
        <List dataSource={comments} renderItem={(item) => {
          return <List.Item>{item.body}</List.Item>
        }}></List>
      </Drawer>
      <Drawer title="Notifications" open={notificationsOpen} onClose={() => {
        setnotificationsOpen(false)
      }} maskClosable>
        <List dataSource={orders} renderItem={(item) => {
          return <List.Item> <Typography.Text strong> {item.title} </Typography.Text>has been created! </List.Item>
        }}></List>
      </Drawer>
    </div>
  );
}

export default AppHeader;
