import { Dashboard } from "./pages/dashboard";
import { Authenticated, Refine, useGetIdentity } from "@refinedev/core";
import { DevtoolsPanel, DevtoolsProvider } from "@refinedev/devtools";
import { RefineKbar, RefineKbarProvider } from "@refinedev/kbar";

import {
  AuthPage,
  ErrorComponent,
  ThemedLayoutV2,
  ThemedSiderV2,
  useNotificationProvider,
} from "@refinedev/antd";
import "@refinedev/antd/dist/reset.css";

import routerBindings, {
  CatchAllNavigate,
  DocumentTitleHandler,
  NavigateToResource,
  UnsavedChangesNotifier,
} from "@refinedev/react-router";
import { dataProvider, liveProvider } from "@refinedev/supabase";
import { App as AntdApp } from "antd";
import { BrowserRouter, Outlet, Route, Routes } from "react-router";
import authProvider from "./authProvider";
import { Header } from "./components/header";
import { ColorModeContextProvider } from "./contexts/color-mode";
import { supabaseClient } from "./utility";

// Import role-based access utilities
import { UserIdentity, canAccess } from "./utils/roleUtils";

// Import the new components
import { CalendarBookingManagement } from "./pages/bookings/calendar";
import { TherapistProfileManagement } from "./pages/therapists/profile";

// Simple placeholder components for features we haven't built yet
const BookingShow = () => <div style={{padding: 24}}><h1>Booking Details</h1><p>Individual booking details will go here</p></div>;
const BookingEdit = () => <div style={{padding: 24}}><h1>Edit Booking</h1><p>Edit booking form will go here</p></div>;
const BookingCreate = () => <div style={{padding: 24}}><h1>Create Booking</h1><p>Create new booking form will go here</p></div>;

const TherapistList = () => <div style={{padding: 24}}><h1>Therapist Management</h1><p>Admin therapist list will go here</p></div>;
const TherapistShow = () => <div style={{padding: 24}}><h1>Therapist Details</h1><p>Therapist details will go here</p></div>;
const TherapistEdit = () => <div style={{padding: 24}}><h1>Edit Therapist</h1><p>Admin edit therapist will go here</p></div>;
const TherapistCreate = () => <div style={{padding: 24}}><h1>Add New Therapist</h1><p>Create new therapist account will go here</p></div>;

const CustomerList = () => <div style={{padding: 24}}><h1>Customer Management</h1><p>Customer list and management will go here</p></div>;
const CustomerShow = () => <div style={{padding: 24}}><h1>Customer Details</h1><p>Customer profile and booking history will go here</p></div>;
const CustomerEdit = () => <div style={{padding: 24}}><h1>Edit Customer</h1><p>Edit customer information will go here</p></div>;

const ServiceList = () => <div style={{padding: 24}}><h1>Service Management</h1><p>Massage services list will go here</p></div>;
const ServiceShow = () => <div style={{padding: 24}}><h1>Service Details</h1><p>Service details will go here</p></div>;
const ServiceEdit = () => <div style={{padding: 24}}><h1>Edit Service</h1><p>Edit service details will go here</p></div>;
const ServiceCreate = () => <div style={{padding: 24}}><h1>Add New Service</h1><p>Create new massage service will go here</p></div>;

// Super Admin only pages
const SystemSettings = () => <div style={{padding: 24}}><h1>System Settings</h1><p>System configuration will go here</p></div>;
const UserManagement = () => <div style={{padding: 24}}><h1>User Management</h1><p>Manage admin users and therapist accounts</p></div>;
const ActivityLogs = () => <div style={{padding: 24}}><h1>Activity Logs</h1><p>System activity monitoring will go here</p></div>;
const Reports = () => <div style={{padding: 24}}><h1>Business Reports</h1><p>Analytics and business reports will go here</p></div>;

// Access denied component
const AccessDenied = () => (
  <div style={{ padding: 24, textAlign: 'center' }}>
    <h1>Access Denied</h1>
    <p>You don't have permission to access this page.</p>
  </div>
);

// Role-based resource generator
const AppContent: React.FC = () => {
  const { data: identity } = useGetIdentity<UserIdentity>();
  const userRole = identity?.role;

  // Generate resources based on user role
  const getResources = () => {
    const baseResources = [];

    // Dashboard - everyone can see
    if (canAccess(userRole, 'canViewDashboard')) {
      baseResources.push({
        name: "dashboard",
        list: "/",
        meta: {
          label: "Dashboard",
          icon: "🏠",
        },
      });
    }

    // Bookings - admins and therapists
    if (canAccess(userRole, 'canViewBookingCalendar')) {
      baseResources.push({
        name: "bookings",
        list: "/bookings",
        show: "/bookings/show/:id",
        edit: canAccess(userRole, 'canEditAllBookings') ? "/bookings/edit/:id" : undefined,
        create: canAccess(userRole, 'canCreateBookings') ? "/bookings/create" : undefined,
        meta: {
          canDelete: canAccess(userRole, 'canDeleteBookings'),
          label: "Bookings",
          icon: "📅",
        },
      });
    }

    // Therapist Management - admins only
    if (canAccess(userRole, 'canViewAllTherapists')) {
      baseResources.push({
        name: "therapist_profiles",
        list: "/therapists",
        show: "/therapists/show/:id",
        edit: canAccess(userRole, 'canEditAllTherapists') ? "/therapists/edit/:id" : undefined,
        create: canAccess(userRole, 'canCreateTherapists') ? "/therapists/create" : undefined,
        meta: {
          canDelete: canAccess(userRole, 'canDeleteBookings'),
          label: "Therapists",
          icon: "👨‍⚕️",
        },
      });
    }

    // My Profile - therapists only
    if (canAccess(userRole, 'canEditOwnProfile') && userRole === 'therapist') {
      baseResources.push({
        name: "my-profile",
        list: "/my-profile",
        meta: {
          label: "My Profile",
          icon: "👤",
        },
      });
    }

    // Customer Management - admins only
    if (canAccess(userRole, 'canViewAllCustomers')) {
      baseResources.push({
        name: "customers",
        list: "/customers",
        show: "/customers/show/:id",
        edit: canAccess(userRole, 'canEditCustomers') ? "/customers/edit/:id" : undefined,
        create: canAccess(userRole, 'canCreateCustomers') ? "/customers/create" : undefined,
        meta: {
          canDelete: canAccess(userRole, 'canDeleteCustomers'),
          label: "Customers",
          icon: "👥",
        },
      });
    }

    // Service Management
    if (canAccess(userRole, 'canViewServices')) {
      baseResources.push({
        name: "services",
        list: "/services",
        show: "/services/show/:id",
        edit: canAccess(userRole, 'canEditServices') ? "/services/edit/:id" : undefined,
        create: canAccess(userRole, 'canCreateServices') ? "/services/create" : undefined,
        meta: {
          canDelete: canAccess(userRole, 'canDeleteServices'),
          label: "Services",
          icon: "💆‍♀️",
        },
      });
    }

    // Reports - admins only
    if (canAccess(userRole, 'canViewReports')) {
      baseResources.push({
        name: "reports",
        list: "/reports",
        meta: {
          label: "Reports",
          icon: "📊",
        },
      });
    }

    // System Settings - super admin only
    if (canAccess(userRole, 'canAccessSystemSettings')) {
      baseResources.push({
        name: "system-settings",
        list: "/system-settings",
        meta: {
          label: "System Settings",
          icon: "⚙️",
        },
      });
    }

    // User Management - super admin only
    if (canAccess(userRole, 'canManageUsers')) {
      baseResources.push({
        name: "user-management",
        list: "/user-management",
        meta: {
          label: "User Management",
          icon: "👤",
        },
      });
    }

    // Activity Logs - super admin only
    if (canAccess(userRole, 'canViewActivityLogs')) {
      baseResources.push({
        name: "activity-logs",
        list: "/activity-logs",
        meta: {
          label: "Activity Logs",
          icon: "📝",
        },
      });
    }

    return baseResources;
  };

  return (
    <Refine
      dataProvider={dataProvider(supabaseClient)}
      liveProvider={liveProvider(supabaseClient)}
      authProvider={authProvider}
      routerProvider={routerBindings}
      notificationProvider={useNotificationProvider}
      resources={getResources()}
      options={{
        syncWithLocation: true,
        warnWhenUnsavedChanges: true,
        useNewQueryKeys: true,
        projectId: "KzRnmo-KKZ8aE-7jCGlj",
      }}
    >
      <Routes>
        <Route
          element={
            <Authenticated
              key="authenticated-inner"
              fallback={<CatchAllNavigate to="/login" />}
            >
              <ThemedLayoutV2
                Header={Header}
                Sider={(props) => <ThemedSiderV2 {...props} fixed />}
              >
                <Outlet />
              </ThemedLayoutV2>
            </Authenticated>
          }
        >
          {/* Dashboard */}
          <Route 
            index 
            element={
              canAccess(userRole, 'canViewDashboard') ? 
              <Dashboard /> : 
              <AccessDenied />
            } 
          />
          
          {/* Booking Management */}
          <Route path="/bookings">
            <Route 
              index 
              element={
                canAccess(userRole, 'canViewBookingCalendar') ? 
                <CalendarBookingManagement /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="create" 
              element={
                canAccess(userRole, 'canCreateBookings') ? 
                <BookingCreate /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                canAccess(userRole, 'canEditAllBookings') || canAccess(userRole, 'canEditOwnBookings') ? 
                <BookingEdit /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="show/:id" 
              element={
                canAccess(userRole, 'canViewAllBookings') || canAccess(userRole, 'canViewOwnBookings') ? 
                <BookingShow /> : 
                <AccessDenied />
              } 
            />
          </Route>
          
          {/* Therapist Management (Admin) */}
          <Route path="/therapists">
            <Route 
              index 
              element={
                canAccess(userRole, 'canViewAllTherapists') ? 
                <TherapistList /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="create" 
              element={
                canAccess(userRole, 'canCreateTherapists') ? 
                <TherapistCreate /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                canAccess(userRole, 'canEditAllTherapists') ? 
                <TherapistEdit /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="show/:id" 
              element={
                canAccess(userRole, 'canViewAllTherapists') ? 
                <TherapistShow /> : 
                <AccessDenied />
              } 
            />
          </Route>
          
          {/* Therapist Profile Management (Therapist-only) */}
          <Route 
            path="/my-profile" 
            element={
              canAccess(userRole, 'canEditOwnProfile') && userRole === 'therapist' ? 
              <TherapistProfileManagement /> : 
              <AccessDenied />
            } 
          />
          
          {/* Customer Management */}
          <Route path="/customers">
            <Route 
              index 
              element={
                canAccess(userRole, 'canViewAllCustomers') ? 
                <CustomerList /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                canAccess(userRole, 'canEditCustomers') ? 
                <CustomerEdit /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="show/:id" 
              element={
                canAccess(userRole, 'canViewAllCustomers') ? 
                <CustomerShow /> : 
                <AccessDenied />
              } 
            />
          </Route>
          
          {/* Service Management */}
          <Route path="/services">
            <Route 
              index 
              element={
                canAccess(userRole, 'canViewServices') ? 
                <ServiceList /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="create" 
              element={
                canAccess(userRole, 'canCreateServices') ? 
                <ServiceCreate /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="edit/:id" 
              element={
                canAccess(userRole, 'canEditServices') ? 
                <ServiceEdit /> : 
                <AccessDenied />
              } 
            />
            <Route 
              path="show/:id" 
              element={
                canAccess(userRole, 'canViewServices') ? 
                <ServiceShow /> : 
                <AccessDenied />
              } 
            />
          </Route>
          
          {/* Reports (Admin+) */}
          <Route 
            path="/reports" 
            element={
              canAccess(userRole, 'canViewReports') ? 
              <Reports /> : 
              <AccessDenied />
            } 
          />
          
          {/* System Settings (Super Admin Only) */}
          <Route 
            path="/system-settings" 
            element={
              canAccess(userRole, 'canAccessSystemSettings') ? 
              <SystemSettings /> : 
              <AccessDenied />
            } 
          />
          
          {/* User Management (Super Admin Only) */}
          <Route 
            path="/user-management" 
            element={
              canAccess(userRole, 'canManageUsers') ? 
              <UserManagement /> : 
              <AccessDenied />
            } 
          />
          
          {/* Activity Logs (Super Admin Only) */}
          <Route 
            path="/activity-logs" 
            element={
              canAccess(userRole, 'canViewActivityLogs') ? 
              <ActivityLogs /> : 
              <AccessDenied />
            } 
          />
          
          <Route path="*" element={<ErrorComponent />} />
        </Route>
        
        <Route
          element={
            <Authenticated
              key="authenticated-outer"
              fallback={<Outlet />}
            >
              <NavigateToResource />
            </Authenticated>
          }
        >
          <Route
            path="/login"
            element={
              <AuthPage
                type="login"
                title="Rejuvenators Admin Panel"
                formProps={{
                  initialValues: {
                    email: "admin@rejuvenators.com",
                    password: "admin123",
                  },
                }}
              />
            }
          />
        </Route>
      </Routes>

      <RefineKbar />
      <UnsavedChangesNotifier />
      <DocumentTitleHandler />
    </Refine>
  );
};

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <AppContent />
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
