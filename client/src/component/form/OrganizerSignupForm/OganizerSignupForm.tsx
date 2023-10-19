import { useState } from 'react';
import { Form, Input, message, Modal } from 'antd';
import { useOrgan } from '../../../contexts/OrganizerContext';
import './styles.css'
import axios from 'axios';

const formItemLayout = {
  labelCol: { span: 6 },
  wrapperCol: { span: 14 },
};

const API_ENDPOINT = import.meta.env.VITE_API_ENDPOINT;


const OrganizerSignupForm = () => {

    // Create campaign modal
    const {showOrganizerSignupForm, setShowOrganizerSignupForm, setOrganizerID} = useOrgan();

    const handleOk = () => {
        form.submit()
    };
    
    const handleCancel = () => {
        showConfirmModal();
    };

    // Create campaign form
    const [form] = Form.useForm();

    const onFinish = (values: any) => {
        console.log(values)
        values = {
            ...values,
            userID: localStorage.getItem('userID'),
        }
        axios.post(`${API_ENDPOINT}/create-organizer`, values)
            .then((result) => {
                console.log(result);
                setOrganizerID(result.data.organizerID);
                if (result.data.success) {
                    setShowOrganizerSignupForm(false);
                    message.success('You have successfully registered as an organizer!');
                    form.resetFields()
                }
                else {
                    message.error('Please try again!')
                }
            })
    };
    
    // Confirm modal
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);

    const showConfirmModal = () => {
        setIsConfirmModalOpen(true);
    };

    const handleConfirmOk = () => {
        setShowOrganizerSignupForm(false);
        setIsConfirmModalOpen(false);
    };

    const handleConfirmCancel = () => {
        setIsConfirmModalOpen(false);
    };

    return (
        <>  
        <Modal title="Organization Information" open={showOrganizerSignupForm} onOk={handleOk} onCancel={handleCancel} centered
            okText="Confirm"
            cancelText="Cancel"
        >
            <Form
                name="createOrganizer"
                {...formItemLayout}
                onFinish={onFinish}
                form={form}
                style={{ maxWidth: 1000 }}
            >
                <Form.Item
                name="name"
                label="Name"
                rules={[{ required: true, message: 'Please input your organization name!' }]}
                >
                    <Input allowClear placeholder="Please input your organization name"/>
                </Form.Item>

                <Form.Item
                name="description"
                label="Description"
                >
                    <Input allowClear placeholder="Please input your description"/>
                </Form.Item>

                <Form.Item name="email" label="Email"
                rules={[{
                        type: 'email',
                        message: 'The input is not valid email!',
                    }]}
                >
                    <Input allowClear placeholder="Please input your email"/>
                </Form.Item>

                <Form.Item name="phoneNumber" label="Phone number"
                rules={[
                    (/*{ getFieldValue }*/) => ({
                        validator(_, value) {
                          const phoneNumberPattern = /^(\+\d{1,3}\s?)?(\(\d{1,3}\)\s?)?\d{10,14}$/
                          if (!value || !phoneNumberPattern.test(value)) {
                              return Promise.reject(new Error('The input is not valid phone number!'));
                            }
                            return Promise.resolve();
                        },
                      }),
                    ]}
                >
                    <Input allowClear placeholder="Please input your phone number"/>
                </Form.Item>

                <Form.Item name="website" label="Website"
                rules={[{
                        type: 'url',
                        message: 'The input is not valid url!',
                    }]}
                >
                    <Input allowClear placeholder="Please input your website"/>
                </Form.Item>

                <Form.Item name="fb_Link" label="Facebook link"
                rules={[{
                        type: 'url',
                        message: 'The input is not valid url!',
                    }]}
                >
                    <Input allowClear placeholder="Please input your Facebook link"/>
                </Form.Item>

                <Form.Item name="linkedIn_Link" label="LinkedIn link"
                rules={[{
                        type: 'url',
                        message: 'The input is not valid url!',
                    }]}
                >
                    <Input allowClear placeholder="Please input your LinkedIn link"/>
                </Form.Item>
            </Form>          
        </Modal>
        <Modal 
            centered 
            title = "Do you want to stop the process and close the form?"
            open={isConfirmModalOpen} 
            onOk={handleConfirmOk} onCancel={handleConfirmCancel}
            width={480}
        >
            <p>All information will be discarded.</p>
        </Modal>
        </>
    );
};

export default OrganizerSignupForm;