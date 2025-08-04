import React, { useState, useEffect } from 'react';
import {
  Table,
  Card,
  Row,
  Col,
  Button,
  Space,
  Typography,
  Tag,
  Input,
  Select,
  DatePicker,
  Modal,
  message,
  Tooltip,
  Badge,
  Dropdown,
  Menu,
  Checkbox,
  Popconfirm,
  Avatar,
  Drawer,
  Form,
  TimePicker,
  Switch,
  Divider,
  Statistic,
} from 'antd';
import {
  SearchOutlined,
  FilterOutlined,
  PlusOutlined,
  EditOutlined,
  EyeOutlined,
  DeleteOutlined,
  MoreOutlined,
  CalendarOutlined,
  UserOutlined,
  DollarOutlined,
  PhoneOutlined,
  EnvironmentOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ClockCircleOutlined,
  ExclamationCircleOutlined,
  ReloadOutlined,
  ExportOutlined,
} from '@ant-design/icons';
import { useGetIdentity, useNavigation } from '@refinedev/core';
import { supabaseClient } from '../../utility';
import { UserIdentity, canAccess, isTherapist, isAdmin } from '../../utils/roleUtils';
import { RoleGuard } from '../../components/RoleGuard';
import dayjs, { Dayjs } from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;
const { RangePicker } = DatePicker;
const { Search } = Input;

// Interfaces
interface Booking {
  id: string;
  customer_id: string;
  therapist_id: string;
  service_id: string;
  booking_time: string;
  status: string;
  payment_status: string;
  price: number;
  therapist_fee: number;
  address: string;
  notes?: string;
  customer_name: string;
  therapist_name: string;
  service_name: string;
  customer_email?: string;
  customer_phone?: string;
  created_at: string;
  updated_at: string;
}

interface Therapist {
  id: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

interface Service {
  id: string;
  name: string;
  is_active: boolean;
}

interface Customer {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
}

export const BookingList: React.FC = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const { show, edit } = useNavigation();
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [therapists, setTherapists] = useState<Therapist[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([]);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    payment_status: 'all',
    therapist_id: 'all',
    service_id: 'all',
    date_range: null as [Dayjs, Dayjs] | null,
  });
  const [pagination, setPagination] = useState({
    current: 1,
    pageSize: 20,
    total: 0,
  });
  const [showFilters, setShowFilters] = useState(false);
  const [showBulkActions, setShowBulkActions] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const userRole = identity?.role;

  useEffect(() => {
    if (identity) {
      initializeData();
    }
  }, [identity]);

  useEffect(() => {
    fetchBookings();
  }, [filters, pagination.current, pagination.pageSize]);

  const initializeData = async () => {
    try {
      await Promise.all([
        fetchTherapists(),
        fetchServices(),
        fetchCustomers(),
      ]);
    } catch (error) {
      console.error('Error initializing data:', error);
      message.error('Failed to load initial data');
    }
  };

  const fetchTherapists = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('therapist_profiles')
        .select('id, first_name, last_name, is_active')
        .eq('is_active', true)
        .order('first_name');

      if (error) throw error;
      setTherapists(data || []);
    } catch (error) {
      console.error('Error fetching therapists:', error);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('services')
        .select('id, name, is_active')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      setServices(data || []);
    } catch (error) {
      console.error('Error fetching services:', error);
    }
  };

  const fetchCustomers = async () => {
    try {
      const { data, error } = await supabaseClient
        .from('customers')
        .select('id, first_name, last_name, email, phone')
        .order('first_name');

      if (error) throw error;
      setCustomers(data || []);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBookings = async () => {
    setLoading(true);
    try {
      let query = supabaseClient
        .from('bookings')
        .select(`
          *,
          customers!inner(first_name, last_name, email, phone),
          therapist_profiles!inner(first_name, last_name),
          services!inner(name)
        `)
        .order('booking_time', { ascending: false });

      // Apply filters
      if (filters.status !== 'all') {
        query = query.eq('status', filters.status);
      }
      if (filters.payment_status !== 'all') {
        query = query.eq('payment_status', filters.payment_status);
      }
      if (filters.therapist_id !== 'all') {
        query = query.eq('therapist_id', filters.therapist_id);
      }
      if (filters.service_id !== 'all') {
        query = query.eq('service_id', filters.service_id);
      }
      if (filters.date_range) {
        query = query
          .gte('booking_time', filters.date_range[0].format('YYYY-MM-DD'))
          .lte('booking_time', filters.date_range[1].format('YYYY-MM-DD'));
      }
      if (filters.search) {
        query = query.or(`
          customers.first_name.ilike.%${filters.search}%,
          customers.last_name.ilike.%${filters.search}%,
          customers.email.ilike.%${filters.search}%,
          customers.phone.ilike.%${filters.search}%,
          therapist_profiles.first_name.ilike.%${filters.search}%,
          therapist_profiles.last_name.ilike.%${filters.search}%,
          services.name.ilike.%${filters.search}%
        `);
      }

      // Apply pagination
      const from = (pagination.current - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to include joined fields
      const transformedBookings = (data || []).map((booking: any) => ({
        ...booking,
        customer_name: `${booking.customers.first_name} ${booking.customers.last_name}`,
        therapist_name: `${booking.therapist_profiles.first_name} ${booking.therapist_profiles.last_name}`,
        service_name: booking.services.name,
        customer_email: booking.customers.email,
        customer_phone: booking.customers.phone,
      }));

      setBookings(transformedBookings);
      setPagination(prev => ({ ...prev, total: count || 0 }));
    } catch (error) {
      console.error('Error fetching bookings:', error);
      message.error('Failed to load bookings');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      requested: 'orange',
      confirmed: 'blue',
      completed: 'green',
      cancelled: 'red',
      declined: 'red',
      timeout_reassigned: 'purple',
      seeking_alternate: 'orange',
    };
    return colors[status] || 'default';
  };

  const getPaymentStatusColor = (status: string) => {
    const colors: { [key: string]: string } = {
      pending: 'orange',
      paid: 'green',
      refunded: 'red',
    };
    return colors[status] || 'default';
  };

  const handleStatusChange = async (bookingId: string, newStatus: string) => {
    try {
      const { error } = await supabaseClient
        .from('bookings')
        .update({ status: newStatus })
        .eq('id', bookingId);

      if (error) throw error;

      message.success(`Booking status updated to ${newStatus}`);
      fetchBookings();
    } catch (error) {
      console.error('Error updating booking status:', error);
      message.error('Failed to update booking status');
    }
  };

  const handleBulkStatusChange = async (newStatus: string) => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select bookings to update');
      return;
    }

    setBulkActionLoading(true);
    try {
      const { error } = await supabaseClient
        .from('bookings')
        .update({ status: newStatus })
        .in('id', selectedRowKeys);

      if (error) throw error;

      message.success(`Updated ${selectedRowKeys.length} bookings to ${newStatus}`);
      setSelectedRowKeys([]);
      fetchBookings();
    } catch (error) {
      console.error('Error updating bulk bookings:', error);
      message.error('Failed to update bookings');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedRowKeys.length === 0) {
      message.warning('Please select bookings to delete');
      return;
    }

    setBulkActionLoading(true);
    try {
      const { error } = await supabaseClient
        .from('bookings')
        .delete()
        .in('id', selectedRowKeys);

      if (error) throw error;

      message.success(`Deleted ${selectedRowKeys.length} bookings`);
      setSelectedRowKeys([]);
      fetchBookings();
    } catch (error) {
      console.error('Error deleting bookings:', error);
      message.error('Failed to delete bookings');
    } finally {
      setBulkActionLoading(false);
    }
  };

  const columns = [
    {
      title: 'Customer',
      dataIndex: 'customer_name',
      key: 'customer_name',
      render: (text: string, record: Booking) => (
        <Space direction="vertical" size="small">
          <Text strong>{text}</Text>
          <Space size="small">
            {record.customer_email && (
              <Tooltip title={record.customer_email}>
                <UserOutlined style={{ color: '#1890ff' }} />
              </Tooltip>
            )}
            {record.customer_phone && (
              <Tooltip title={record.customer_phone}>
                <PhoneOutlined style={{ color: '#52c41a' }} />
              </Tooltip>
            )}
          </Space>
        </Space>
      ),
    },
    {
      title: 'Service',
      dataIndex: 'service_name',
      key: 'service_name',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'Therapist',
      dataIndex: 'therapist_name',
      key: 'therapist_name',
      render: (text: string) => <Text>{text}</Text>,
    },
    {
      title: 'Date & Time',
      dataIndex: 'booking_time',
      key: 'booking_time',
      render: (text: string) => (
        <Space direction="vertical" size="small">
          <Text>{dayjs(text).format('MMM DD, YYYY')}</Text>
          <Text type="secondary">{dayjs(text).format('HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={getStatusColor(status)}>
          {status.replace('_', ' ').toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Payment',
      dataIndex: 'payment_status',
      key: 'payment_status',
      render: (status: string) => (
        <Tag color={getPaymentStatusColor(status)}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
    {
      title: 'Price',
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => (
        <Text strong style={{ color: '#52c41a' }}>
          ${price.toFixed(2)}
        </Text>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (text: string, record: Booking) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="text"
              icon={<EyeOutlined />}
              onClick={() => show('bookings', record.id)}
            />
          </Tooltip>
          <Tooltip title="Edit Booking">
            <Button
              type="text"
              icon={<EditOutlined />}
              onClick={() => edit('bookings', record.id)}
            />
          </Tooltip>
          <Dropdown
            overlay={
              <Menu>
                <Menu.Item
                  key="confirm"
                  onClick={() => handleStatusChange(record.id, 'confirmed')}
                  disabled={record.status === 'confirmed'}
                >
                  Confirm
                </Menu.Item>
                <Menu.Item
                  key="complete"
                  onClick={() => handleStatusChange(record.id, 'completed')}
                  disabled={record.status === 'completed'}
                >
                  Mark Complete
                </Menu.Item>
                <Menu.Item
                  key="cancel"
                  onClick={() => handleStatusChange(record.id, 'cancelled')}
                  disabled={record.status === 'cancelled'}
                >
                  Cancel
                </Menu.Item>
              </Menu>
            }
          >
            <Button type="text" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ];

  const rowSelection = {
    selectedRowKeys,
    onChange: (selectedKeys: React.Key[]) => {
      setSelectedRowKeys(selectedKeys as string[]);
      setShowBulkActions(selectedKeys.length > 0);
    },
  };

  return (
    <RoleGuard allowedRoles={['super_admin', 'admin', 'therapist']}>
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
          <Col span={12}>
            <Title level={3}>Bookings</Title>
          </Col>
          <Col span={12} style={{ textAlign: 'right' }}>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchBookings}
                loading={loading}
              >
                Refresh
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                href="https://your-booking-platform-url.com"
                target="_blank"
              >
                New Booking
              </Button>
            </Space>
          </Col>
        </Row>

        {/* Filters */}
        <Card style={{ marginBottom: 16 }}>
          <Row gutter={[16, 16]} align="middle">
            <Col span={6}>
              <Search
                placeholder="Search bookings..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                onSearch={() => setPagination(prev => ({ ...prev, current: 1 }))}
                allowClear
              />
            </Col>
            <Col span={4}>
              <Select
                placeholder="Status"
                value={filters.status}
                onChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="all">All Status</Option>
                <Option value="requested">Requested</Option>
                <Option value="confirmed">Confirmed</Option>
                <Option value="completed">Completed</Option>
                <Option value="cancelled">Cancelled</Option>
                <Option value="declined">Declined</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Payment"
                value={filters.payment_status}
                onChange={(value) => setFilters(prev => ({ ...prev, payment_status: value }))}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="all">All Payments</Option>
                <Option value="pending">Pending</Option>
                <Option value="paid">Paid</Option>
                <Option value="refunded">Refunded</Option>
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Therapist"
                value={filters.therapist_id}
                onChange={(value) => setFilters(prev => ({ ...prev, therapist_id: value }))}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="all">All Therapists</Option>
                {therapists.map(therapist => (
                  <Option key={therapist.id} value={therapist.id}>
                    {therapist.first_name} {therapist.last_name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={4}>
              <Select
                placeholder="Service"
                value={filters.service_id}
                onChange={(value) => setFilters(prev => ({ ...prev, service_id: value }))}
                style={{ width: '100%' }}
                allowClear
              >
                <Option value="all">All Services</Option>
                {services.map(service => (
                  <Option key={service.id} value={service.id}>
                    {service.name}
                  </Option>
                ))}
              </Select>
            </Col>
            <Col span={2}>
              <Button
                icon={<FilterOutlined />}
                onClick={() => setShowFilters(!showFilters)}
              >
                More
              </Button>
            </Col>
          </Row>

          {showFilters && (
            <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
              <Col span={8}>
                <RangePicker
                  placeholder={['Start Date', 'End Date']}
                  value={filters.date_range}
                  onChange={(dates) => setFilters(prev => ({ ...prev, date_range: dates }))}
                  style={{ width: '100%' }}
                />
              </Col>
            </Row>
          )}
        </Card>

        {/* Bulk Actions */}
        {showBulkActions && (
          <Card style={{ marginBottom: 16, backgroundColor: '#f0f8ff' }}>
            <Row gutter={[16, 16]} align="middle">
              <Col span={8}>
                <Text strong>
                  {selectedRowKeys.length} booking(s) selected
                </Text>
              </Col>
              <Col span={16} style={{ textAlign: 'right' }}>
                <Space>
                  <Button
                    onClick={() => handleBulkStatusChange('confirmed')}
                    loading={bulkActionLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Confirm Selected
                  </Button>
                  <Button
                    onClick={() => handleBulkStatusChange('completed')}
                    loading={bulkActionLoading}
                    icon={<CheckCircleOutlined />}
                  >
                    Mark Complete
                  </Button>
                  <Button
                    danger
                    onClick={() => handleBulkStatusChange('cancelled')}
                    loading={bulkActionLoading}
                    icon={<CloseCircleOutlined />}
                  >
                    Cancel Selected
                  </Button>
                  <Popconfirm
                    title="Are you sure you want to delete these bookings?"
                    onConfirm={handleBulkDelete}
                    okText="Yes"
                    cancelText="No"
                  >
                    <Button
                      danger
                      loading={bulkActionLoading}
                      icon={<DeleteOutlined />}
                    >
                      Delete Selected
                    </Button>
                  </Popconfirm>
                </Space>
              </Col>
            </Row>
          </Card>
        )}

        {/* Bookings Table */}
        <Card>
          <Table
            rowKey="id"
            columns={columns}
            dataSource={bookings}
            loading={loading}
            pagination={{
              ...pagination,
              showSizeChanger: true,
              showQuickJumper: true,
              showTotal: (total, range) =>
                `${range[0]}-${range[1]} of ${total} bookings`,
            }}
            rowSelection={rowSelection}
            scroll={{ x: 1200 }}
          />
        </Card>
      </div>
    </RoleGuard>
  );
}; 