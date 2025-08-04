import React, { useState, useEffect } from 'react';
import {
  Card,
  Row,
  Col,
  Form,
  Input,
  Button,
  Upload,
  Avatar,
  Typography,
  Divider,
  TimePicker,
  Switch,
  Select,
  InputNumber,
  message,
  Space,
  Table,
  Tag,
  Modal,
  Rate,
} from 'antd';
import {
  UserOutlined,
  CameraOutlined,
  SaveOutlined,
  EnvironmentOutlined,
  PhoneOutlined,
  MailOutlined,
  ClockCircleOutlined,
  StarOutlined,
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
} from '@ant-design/icons';
import { useGetIdentity } from '@refinedev/core';
import { supabaseClient } from '../../utility';
import { UserIdentity, isTherapist } from '../../utils/roleUtils';
import { RoleGuard } from '../../components/RoleGuard';
import dayjs from 'dayjs';
import type { UploadFile, UploadProps } from 'antd';

const { Title, Text, Paragraph } = Typography;
const { TextArea } = Input;
const { Option } = Select;

// Interfaces
interface TherapistProfile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  profile_pic?: string;
  home_address?: string;
  latitude?: number;
  longitude?: number;
  service_radius_km?: number;
  is_active: boolean;
  gender?: string;
  years_experience?: number;
  rating: number;
  total_reviews: number;
}

interface AvailabilitySlot {
  id?: string;
  therapist_id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
}

interface ServiceOption {
  id: string;
  name: string;
  description?: string;
  service_base_price: number;
}

export const TherapistProfileManagement: React.FC = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<TherapistProfile | null>(null);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  const [services, setServices] = useState<ServiceOption[]>([]);
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'availability' | 'services'>('profile');
  const [fileList, setFileList] = useState<UploadFile[]>([]);
  
  const userRole = identity?.role;
  const [profileForm] = Form.useForm();
  const [availabilityForm] = Form.useForm();

  useEffect(() => {
    if (identity && isTherapist(userRole)) {
      fetchTherapistData();
    }
  }, [identity]);

  const fetchTherapistData = async () => {
    try {
      setLoading(true);
      
      // Get therapist profile
      const { data: profileData, error: profileError } = await supabaseClient
        .from('therapist_profiles')
        .select('*')
        .eq('user_id', identity?.id)
        .single();

      if (profileError) throw profileError;
      
      setProfile(profileData);
      profileForm.setFieldsValue(profileData);

      // Set profile picture if exists
      if (profileData.profile_pic) {
        setFileList([{
          uid: '1',
          name: 'profile.jpg',
          status: 'done',
          url: profileData.profile_pic,
        }]);
      }

      // Get availability
      const { data: availabilityData, error: availabilityError } = await supabaseClient
        .from('therapist_availability')
        .select('*')
        .eq('therapist_id', profileData.id)
        .order('day_of_week');

      if (availabilityError) throw availabilityError;
      setAvailability(availabilityData || []);

      // Get all services
      const { data: servicesData, error: servicesError } = await supabaseClient
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');

      if (servicesError) throw servicesError;
      setServices(servicesData || []);

      // Get therapist's selected services
      const { data: therapistServicesData, error: therapistServicesError } = await supabaseClient
        .from('therapist_services')
        .select('service_id')
        .eq('therapist_id', profileData.id);

      if (therapistServicesError) throw therapistServicesError;
      setSelectedServices(therapistServicesData?.map(ts => ts.service_id) || []);

    } catch (error) {
      console.error('Error fetching therapist data:', error);
      message.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSave = async (values: any) => {
    try {
      setSaving(true);
      
      const updateData = {
        ...values,
        profile_pic: fileList[0]?.url || null,
      };

      const { error } = await supabaseClient
        .from('therapist_profiles')
        .update(updateData)
        .eq('id', profile?.id);

      if (error) throw error;

      message.success('Profile updated successfully!');
      setProfile({ ...profile!, ...updateData });
    } catch (error) {
      console.error('Error updating profile:', error);
      message.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleAvailabilityAdd = async (values: any) => {
    try {
      const newSlot: AvailabilitySlot = {
        therapist_id: profile!.id,
        day_of_week: values.day_of_week,
        start_time: values.start_time.format('HH:mm:ss'),
        end_time: values.end_time.format('HH:mm:ss'),
      };

      const { data, error } = await supabaseClient
        .from('therapist_availability')
        .insert([newSlot])
        .select()
        .single();

      if (error) throw error;

      setAvailability([...availability, data]);
      availabilityForm.resetFields();
      message.success('Availability added successfully!');
    } catch (error) {
      console.error('Error adding availability:', error);
      message.error('Failed to add availability');
    }
  };

  const handleAvailabilityDelete = async (id: string) => {
    try {
      const { error } = await supabaseClient
        .from('therapist_availability')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setAvailability(availability.filter(slot => slot.id !== id));
      message.success('Availability removed successfully!');
    } catch (error) {
      console.error('Error deleting availability:', error);
      message.error('Failed to remove availability');
    }
  };

  const handleServicesUpdate = async () => {
    try {
      setSaving(true);

      // First, delete existing services
      await supabaseClient
        .from('therapist_services')
        .delete()
        .eq('therapist_id', profile!.id);

      // Then insert new services
      if (selectedServices.length > 0) {
        const therapistServicesData = selectedServices.map(serviceId => ({
          therapist_id: profile!.id,
          service_id: serviceId,
        }));

        const { error } = await supabaseClient
          .from('therapist_services')
          .insert(therapistServicesData);

        if (error) throw error;
      }

      message.success('Services updated successfully!');
    } catch (error) {
      console.error('Error updating services:', error);
      message.error('Failed to update services');
    } finally {
      setSaving(false);
    }
  };

  const uploadProps: UploadProps = {
    name: 'file',
    listType: 'picture-card',
    fileList,
    beforeUpload: () => false, // Prevent automatic upload
    onChange: ({ fileList: newFileList }) => {
      setFileList(newFileList);
    },
    onPreview: (file) => {
      const src = file.url || file.preview;
      if (src) {
        const image = new Image();
        image.src = src;
        const imgWindow = window.open(src);
        imgWindow?.document.write(image.outerHTML);
      }
    },
  };

  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

  const availabilityColumns = [
    {
      title: 'Day',
      dataIndex: 'day_of_week',
      key: 'day_of_week',
      render: (day: number) => dayNames[day],
    },
    {
      title: 'Start Time',
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('h:mm A'),
    },
    {
      title: 'End Time',
      dataIndex: 'end_time',
      key: 'end_time',
      render: (time: string) => dayjs(time, 'HH:mm:ss').format('h:mm A'),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: any, record: AvailabilitySlot) => (
        <Button
          danger
          size="small"
          icon={<DeleteOutlined />}
          onClick={() => handleAvailabilityDelete(record.id!)}
        >
          Remove
        </Button>
      ),
    },
  ];

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Text>Loading profile...</Text>
      </div>
    );
  }

  return (
    <RoleGuard requiredRole="therapist">
      <div style={{ padding: 24 }}>
        <Title level={2}>My Profile</Title>
        <Text type="secondary">Manage your profile, availability, and services</Text>

        <Row gutter={24} style={{ marginTop: 24 }}>
          {/* Profile Overview */}
          <Col span={8}>
            <Card>
              <div style={{ textAlign: 'center' }}>
                <Avatar
                  size={120}
                  src={profile?.profile_pic}
                  icon={<UserOutlined />}
                  style={{ marginBottom: 16 }}
                />
                <Title level={4} style={{ margin: 0 }}>
                  {profile?.first_name} {profile?.last_name}
                </Title>
                <Text type="secondary">{profile?.email}</Text>
                
                <Divider />
                
                <Space direction="vertical" size="small" style={{ width: '100%' }}>
                  <div>
                    <StarOutlined style={{ color: '#faad14', marginRight: 8 }} />
                    <Text strong>{profile?.rating.toFixed(1)}</Text>
                    <Text type="secondary"> ({profile?.total_reviews} reviews)</Text>
                  </div>
                  
                  <div>
                    <Text type="secondary">Experience: </Text>
                    <Text>{profile?.years_experience || 0} years</Text>
                  </div>
                  
                  <div>
                    <Text type="secondary">Status: </Text>
                    <Tag color={profile?.is_active ? 'green' : 'red'}>
                      {profile?.is_active ? 'Active' : 'Inactive'}
                    </Tag>
                  </div>
                </Space>
              </div>
            </Card>
          </Col>

          {/* Profile Management Tabs */}
          <Col span={16}>
            <Card
              tabList={[
                { key: 'profile', tab: 'Profile Details' },
                { key: 'availability', tab: 'Availability' },
                { key: 'services', tab: 'Services' },
              ]}
              activeTabKey={activeTab}
              onTabChange={(key) => setActiveTab(key as 'profile' | 'availability' | 'services')}
            >
              {/* Profile Tab */}
              {activeTab === 'profile' && (
                <Form
                  form={profileForm}
                  layout="vertical"
                  onFinish={handleProfileSave}
                  initialValues={profile || {}}
                >
                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="First Name"
                        name="first_name"
                        rules={[{ required: true, message: 'Please enter your first name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Last Name"
                        name="last_name"
                        rules={[{ required: true, message: 'Please enter your last name' }]}
                      >
                        <Input />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Email"
                        name="email"
                        rules={[
                          { required: true, message: 'Please enter your email' },
                          { type: 'email', message: 'Please enter a valid email' }
                        ]}
                      >
                        <Input prefix={<MailOutlined />} />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Phone"
                        name="phone"
                      >
                        <Input prefix={<PhoneOutlined />} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Row gutter={16}>
                    <Col span={12}>
                      <Form.Item
                        label="Gender"
                        name="gender"
                      >
                        <Select>
                          <Option value="male">Male</Option>
                          <Option value="female">Female</Option>
                          <Option value="other">Other</Option>
                          <Option value="prefer_not_to_say">Prefer not to say</Option>
                        </Select>
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        label="Years of Experience"
                        name="years_experience"
                      >
                        <InputNumber min={0} max={50} style={{ width: '100%' }} />
                      </Form.Item>
                    </Col>
                  </Row>

                  <Form.Item
                    label="Profile Picture"
                  >
                    <Upload {...uploadProps}>
                      {fileList.length >= 1 ? null : (
                        <div>
                          <PlusOutlined />
                          <div style={{ marginTop: 8 }}>Upload</div>
                        </div>
                      )}
                    </Upload>
                  </Form.Item>

                  <Form.Item
                    label="Bio"
                    name="bio"
                  >
                    <TextArea
                      rows={4}
                      placeholder="Tell customers about yourself, your specialties, and your approach to massage therapy..."
                    />
                  </Form.Item>

                  <Form.Item
                    label="Home Address"
                    name="home_address"
                  >
                    <Input
                      prefix={<EnvironmentOutlined />}
                      placeholder="Your service area base address"
                    />
                  </Form.Item>

                  <Form.Item
                    label="Service Radius (km)"
                    name="service_radius_km"
                  >
                    <InputNumber
                      min={1}
                      max={100}
                      style={{ width: '100%' }}
                      placeholder="How far are you willing to travel?"
                    />
                  </Form.Item>

                  <Form.Item>
                    <Button
                      type="primary"
                      htmlType="submit"
                      loading={saving}
                      icon={<SaveOutlined />}
                    >
                      Save Profile
                    </Button>
                  </Form.Item>
                </Form>
              )}

              {/* Availability Tab */}
              {activeTab === 'availability' && (
                <div>
                  <Title level={4}>Set Your Availability</Title>
                  <Text type="secondary">
                    Define when you're available for bookings. Customers will only be able to book during these times.
                  </Text>

                  <Divider />

                  {/* Add Availability Form */}
                  <Card title="Add New Availability" size="small" style={{ marginBottom: 16 }}>
                    <Form
                      form={availabilityForm}
                      layout="inline"
                      onFinish={handleAvailabilityAdd}
                    >
                      <Form.Item
                        name="day_of_week"
                        rules={[{ required: true, message: 'Select a day' }]}
                      >
                        <Select placeholder="Select Day" style={{ width: 120 }}>
                          {dayNames.map((day, index) => (
                            <Option key={index} value={index}>{day}</Option>
                          ))}
                        </Select>
                      </Form.Item>

                      <Form.Item
                        name="start_time"
                        rules={[{ required: true, message: 'Select start time' }]}
                      >
                        <TimePicker format="h:mm A" placeholder="Start Time" />
                      </Form.Item>

                      <Form.Item
                        name="end_time"
                        rules={[{ required: true, message: 'Select end time' }]}
                      >
                        <TimePicker format="h:mm A" placeholder="End Time" />
                      </Form.Item>

                      <Form.Item>
                        <Button type="primary" htmlType="submit" icon={<PlusOutlined />}>
                          Add
                        </Button>
                      </Form.Item>
                    </Form>
                  </Card>

                  {/* Current Availability */}
                  <Table
                    dataSource={availability}
                    columns={availabilityColumns}
                    rowKey="id"
                    size="small"
                    pagination={false}
                  />
                </div>
              )}

              {/* Services Tab */}
              {activeTab === 'services' && (
                <div>
                  <Title level={4}>Select Your Services</Title>
                  <Text type="secondary">
                    Choose which massage services you offer. This will determine what customers can book with you.
                  </Text>

                  <Divider />

                  <div style={{ marginBottom: 16 }}>
                    {services.map(service => (
                      <Card
                        key={service.id}
                        size="small"
                        style={{ marginBottom: 8 }}
                        extra={
                          <Switch
                            checked={selectedServices.includes(service.id)}
                            onChange={(checked) => {
                              if (checked) {
                                setSelectedServices([...selectedServices, service.id]);
                              } else {
                                setSelectedServices(selectedServices.filter(id => id !== service.id));
                              }
                            }}
                          />
                        }
                      >
                        <Space direction="vertical" size="small">
                          <Text strong>{service.name}</Text>
                          <Text type="secondary">{service.description}</Text>
                          <Text>Base Price: ${service.service_base_price}</Text>
                        </Space>
                      </Card>
                    ))}
                  </div>

                  <Button
                    type="primary"
                    onClick={handleServicesUpdate}
                    loading={saving}
                    icon={<SaveOutlined />}
                  >
                    Update Services
                  </Button>
                </div>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </RoleGuard>
  );
};
