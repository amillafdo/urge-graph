import {
  AppstoreOutlined,
  StockOutlined,
  WechatOutlined,
  CodeOutlined,
} from "@ant-design/icons";
import { Menu } from "antd";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

function SideMenu() {

  const location = useLocation()
  const [selectedKeys, setSelectedKeys]= useState('/')

  useEffect(() => {

    const pathName = location.pathname
    setSelectedKeys(pathName)

  }, [location.pathname])

  const navigate = useNavigate();
  return (
    <div className="SideMenu">
      <Menu
      className="SideMenuVertical"
      mode="vertical"
        onClick={(item) => {
          //item.key
          navigate(item.key);
        }}

        selectedKeys={[selectedKeys]}

        items={[
          {
            label: "Dashboard",
            icon: <AppstoreOutlined />,
            key: "/Dashboard",
          },
          {
            label: "Support Backlog",
            icon: <WechatOutlined />,
            key: "/SupportTickets",
          },
          {
            label: "Urgency Levels",
            icon: <StockOutlined />,
            key: "/UrgencyLevels",
          },
          {
            label: "Categories",
            icon: <CodeOutlined />,
            key: "/Customers",
          },
        ]}
      ></Menu>
    </div>
  );
}

export default SideMenu;
