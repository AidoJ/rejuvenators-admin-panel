import { Dashboard } from "./pages/dashboard";
import { Authenticated, Refine } from "@refinedev/core";
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

// Simple placeholder components for now - we'll create these properly later
const BookingList = () => <div style={{padding: 24}}><h1>Bookings</h1><p>Massage booking list will go here</p></div>;
const BookingShow = () => <div style={{padding: 24}}><h1>Booking Details</h1></div>;
const BookingEdit = () => <div style={{padding: 24}}><h1>Edit Booking</h1></div>;
const BookingCreate = () => <div style={{padding: 24}}><h1>Create Booking</h1></div>;
const TherapistList = () => <div style={{padding: 24}}><h1>Therapists</h1><p>Therapist management will go here</p></div>;
const TherapistShow = () => <div style={{padding: 24}}><h1>Therapist Details</h1></div>;
const TherapistEdit = () => <div style={{padding: 24}}><h1>Edit Therapist</h1></div>;
const TherapistCreate = () => <div style={{padding: 24}}><h1>Add New Therapist</h1></div>;
const CustomerList = () => <div style={{padding: 24}}><h1>Customers</h1><p>Customer management will go here</p></div>;
const CustomerShow = () => <div style={{padding: 24}}><h1>Customer Details</h1></div>;
const CustomerEdit = () => <div style={{padding: 24}}><h1>Edit Customer</h1></div>;
const ServiceList = () => <div style={{padding: 24}}><h1>Services</h1><p>Massage services management will go here</p></div>;
const ServiceShow = () => <div style={{padding: 24}}><h1>Service Details</h1></div>;
const ServiceEdit = () => <div style={{padding: 24}}><h1>Edit Service</h1></div>;
const ServiceCreate = () => <div style={{padding: 24}}><h1>Add New Service</h1></div>;

function App() {
  return (
    <BrowserRouter>
      <RefineKbarProvider>
        <ColorModeContextProvider>
          <AntdApp>
            <DevtoolsProvider>
              <Refine
                dataProvider={dataProvider(supabaseClient)}
                liveProvider={liveProvider(supabaseClient)}
                authProvider={authProvider}
                routerProvider={routerBindings}
                notificationProvider={useNotificationProvider}
                resources={[
                  {
                    name: "dashboard",
                    list: "/",
                    meta: {
                      label: "Dashboard",
                      icon: "🏠",
                    },
                  },
                  {
                    name: "bookings",
                    list: "/bookings",
                    show: "/bookings/show/:id",
                    edit: "/bookings/edit/:id",
                    create: "/bookings/create",
                    meta: {
                      canDelete: true,
                      label: "Bookings",
                      icon: "📋",
                    },
                  },
                  {
                    name: "therapist_profiles",
                    list: "/therapists",
                    show: "/therapists/show/:id",
                    edit: "/therapists/edit/:id",
                    create: "/therapists/create",
                    meta: {
                      canDelete: true,
                      label: "Therapists",
                      icon: "👨‍⚕️",
                    },
                  },
                  {
                    name: "customers",
                    list: "/customers",
                    show: "/customers/show/:id",
                    edit: "/customers/edit/:id",
                    meta: {
                      canDelete: true,
                      label: "Customers",
                      icon: "👥",
                    },
                  },
                  {
                    name: "services",
                    list: "/services",
                    show: "/services/show/:id",
                    edit: "/services/edit/:id",
                    create: "/services/create",
                    meta: {
                      canDelete: true,
                      label: "Services",
                      icon: "💆‍♀️",
                    },
                  },
                ]}
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
                    <Route index element={<Dashboard />} />
                    
                    <Route path="/bookings">
                      <Route index element={<BookingList />} />
                      <Route path="create" element={<BookingCreate />} />
                      <Route path="edit/:id" element={<BookingEdit />} />
                      <Route path="show/:id" element={<BookingShow />} />
                    </Route>
                    
                    <Route path="/therapists">
                      <Route index element={<TherapistList />} />
                      <Route path="create" element={<TherapistCreate />} />
                      <Route path="edit/:id" element={<TherapistEdit />} />
                      <Route path="show/:id" element={<TherapistShow />} />
                    </Route>
                    
                    <Route path="/customers">
                      <Route index element={<CustomerList />} />
                      <Route path="edit/:id" element={<CustomerEdit />} />
                      <Route path="show/:id" element={<CustomerShow />} />
                    </Route>
                    
                    <Route path="/services">
                      <Route index element={<ServiceList />} />
                      <Route path="create" element={<ServiceCreate />} />
                      <Route path="edit/:id" element={<ServiceEdit />} />
                      <Route path="show/:id" element={<ServiceShow />} />
                    </Route>
                    
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
              <DevtoolsPanel />
            </DevtoolsProvider>
          </AntdApp>
        </ColorModeContextProvider>
      </RefineKbarProvider>
    </BrowserRouter>
  );
}

export default App;
