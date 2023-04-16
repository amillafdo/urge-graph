import { Button, Form, Input, Modal, Space, Table, Typography, Progress, Select, Tag } from "antd";
// import "~antd/dist/antd.css";
import { useEffect, useState } from "react";
import { v4 as uuidv4 } from "uuid";

function Customers() {
  const [loading, setLoading] = useState(false);
  const [dataSource, setDataSource] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [modalType, setModalType] = useState("add");
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);
  const [modalAction, setModalAction] = useState("");
  const { Option } = Select;

  const [form] = Form.useForm();
  const pageId = "customers";

  // Load the data from localStorage when the component mounts
  useEffect(() => {
    const storedData = localStorage.getItem(`${pageId}_dataSource`);
    if (storedData) {
      setDataSource(JSON.parse(storedData));
    }
  }, []);

  const handleAddClick = () => {
    setModalType("add"); // add this line to set modalType to "add"
    setModalAction("add");
    form.resetFields();
    setModalVisible(true);
    setEditingKey(null);
  };

  const handleEdit = (record) => {
    setEditingKey(record.key);
    setModalType("edit");
    form.setFieldsValue(record);
    setModalVisible(true);
  };

  const handleDelete = (key) => {
    setDataSource(dataSource.filter((record) => record.key !== key));
    localStorage.setItem(`${pageId}_dataSource`, JSON.stringify(dataSource)); // Update localStorage
  };

  const handleViewDetails = (record) => {
    setModalType("view"); // update modalType to "view"
    form.setFieldsValue(record);
    setModalVisible(true);
    setModalAction("view");
  };

  const handleSubmit = () => {
    form.validateFields().then((values) => {
      const editedRecord = {
        key: editingKey || uuidv4(),
        Customer: values.Customer,
        Message: values.Message,
        Urgency: "Not Determined",
        Percentage: "0%",
      };
      const existingRecordIndex = dataSource.findIndex(
        (record) => record.key === editedRecord.key
      );
      const newDataSource = [...dataSource]; // make a copy of dataSource
      if (existingRecordIndex > -1 && editingKey) {
        // update existing record
        newDataSource[existingRecordIndex] = editedRecord;
      } else {
        // add new record to the beginning of the array only if modalAction is "add"
        if (modalAction === "add") {
          newDataSource.unshift(editedRecord);
        }
      }
      setDataSource(newDataSource);
      form.resetFields();
      setModalVisible(false);
      setEditingKey(null);
      setModalAction("");
      localStorage.setItem(
        `${pageId}_dataSource`,
        JSON.stringify(newDataSource)
      );
    });
  };

  const handleUrgencyClick = () => {
    const recordsToUpdate = dataSource.filter((record) =>
      selectedRowKeys.includes(record.key)
    );

    const supportTickets = recordsToUpdate.map((record) => record.Message);
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
            Urgency: data[index].class,
            Percentage: `${(data[index].score * 100)
              .toFixed(2)
              .replace(/\.?0*$/, "")}%`,
          };
        });

        const newDataSource = dataSource.map((record) => {
          const updatedRecord = updatedRecords.find(
            (r) => r.key === record.key
          );
          return updatedRecord || record;
        });

        // Save the updated urgency and percentage values to local storage
        localStorage.setItem(
          `${pageId}_dataSource`,
          JSON.stringify(newDataSource)
        );

        setDataSource(newDataSource);
        setLoading(false);
        setSelectedRowKeys([]);
      })
      .catch((error) => {
        console.error(error);
        setLoading(false);
      });
  };

  const urgencyColorMap = {
    Extreme: "red",
    High: "orange",
    Medium: "blue",
    Low: "green",
  };

  return (
    <Space size={20} direction="vertical">
      <Typography.Title level={4}> Insert Support Tickets </Typography.Title>
      <Space>
        <Button type="default" onClick={handleAddClick}>
          Add Support Request
        </Button>
        {selectedRowKeys.length > 0 && (
          <Button type="default" onClick={handleUrgencyClick}>
            Determine Urgency
          </Button>
        )}
      </Space>
      <Table
        loading={loading}
        rowSelection={{
          type: "checkbox",
          selectedRowKeys,
          onChange: setSelectedRowKeys,
        }}
        columns={[
          {
            title: "Customer",
            dataIndex: "Customer",
          },
          {
            title: "Message",
            dataIndex: "Message",
            render: (text) => <span>{text ? text.substr(0, 150) : ""}...</span>,
          },
          {
            title: "Urgency",
            dataIndex: "Urgency",
            render: (text) => <Tag color={urgencyColorMap[text]}>{text}</Tag>,
          },
          {
            title: "Percentage",
            render: (text, record) => {
              const urgencyColor = urgencyColorMap[record.Urgency];
              const percent = parseFloat(record.Percentage);
              const formatPercent = (p) => (
                <span style={{ color: urgencyColor }}>{`${p}%`}</span>
              );
              return (
                <Progress
                  type="circle"
                  percent={percent}
                  format={formatPercent}
                  width={50}
                  strokeColor={urgencyColor}
                />
              );
            },
          },
          {
            title: "Action",
            dataIndex: "key",
            render: (text, record) => (
              <Space>
                <Button
                  type="default"
                  size="medium"
                  onClick={() => handleViewDetails(record)}
                >
                  View
                </Button>
                <Button
                  // className="view-button"
                  type="default"
                  size="medium"
                  onClick={() => handleEdit(record)}
                >
                  Edit
                </Button>
                <Button
                  type="default"
                  size="medium"
                  onClick={() => handleDelete(record.key)}
                >
                  Delete
                </Button>
              </Space>
            ),
          },
        ]}
        dataSource={dataSource}
        pagination={{
          pageSize: 10,
        }}
      />

      <Modal
        title={
          modalType === "add"
            ? "Add Record"
            : modalType === "view"
            ? "View Details"
            : "Edit Record"
        }
        visible={modalVisible}
        onOk={handleSubmit}
        onCancel={() => setModalVisible(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item
            name="Customer"
            label="Customer"
            rules={[{ required: true, message: "Please enter customer name" }]}
          >
            <Input readOnly={modalType === "view"} />
          </Form.Item>
          <Form.Item
            name="Message"
            label="Message"
            rules={[{ required: true, message: "Please enter message" }]}
          >
            <Input.TextArea readOnly={modalType === "view"} rows={8} />
          </Form.Item>
          <Form.Item name="Urgency" label="Urgency">
            <Select defaultValue="Not Determined" readOnly optionFilterProp="">
              <Option value="low">Low</Option>
              <Option value="medium">Medium</Option>
              <Option value="high">High</Option>
            </Select>
          </Form.Item>
          <Form.Item
            name="Percentage"
            label="Percentage"
            initialValues={{ Percentage: 0 }}
          >
            <div style={{ display: "flex", alignItems: "center" }}>
              <Progress
                type="circle"
                percent={parseFloat(form.getFieldValue("Percentage"))}
                format={() => `${form.getFieldValue("Percentage")}`}
                width={80}
                strokeColor={urgencyColorMap[form.getFieldValue("Urgency")]}
              />
            </div>
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}

export default Customers;
