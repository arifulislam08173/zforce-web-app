import React, { useContext } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import Login from "../pages/Auth/Login";
import Signup from "../pages/Auth/Signup";
import Dashboard from "../pages/Dashboard/Dashboard";
import DashboardHome from "../pages/Dashboard/DashboardHome";
import Attendance from "../pages/Attendance/Attendance";
import RoutePlan from "../pages/Route/RoutePlan";
import RouteForm from "../pages/Route/RouteForm";
import Visit from "../pages/Visit/Visit";
import Order from "../pages/Order/Order";
import OrderForm from "../pages/Order/OrderForm";
import Expense from "../pages/Expense/Expense";
import ExpenseForm from "../pages/Expense/ExpenseForm";
import Collection from "../pages/Collection/Collection";
import CollectionForm from "../pages/Collection/CollectionForm";
import User from "../pages/Users/User";
import UserForm from "../pages/Users/UserForm";
import Customer from "../pages/Customer/Customer";
import CustomerForm from "../pages/Customer/CustomerForm";
import Product from "../pages/Product/Product";
import ProductForm from "../pages/Product/ProductForm";
import Company from "../pages/Company/Company";
import CompanyForm from "../pages/Company/CompanyForm";
import CustomerAssignment from "../pages/Assignments/CustomerAssignment";
import Reports from "../pages/Reports/Reports";

import UserCompanyAssignment from "../pages/Assignments/UserCompanyAssignment";
import SalesReport from "../pages/Reports/SalesReport";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return null; // add loading
  return user ? children : <Navigate to="/login" />;
};

const RoleRoute = ({ roles = [], children }) => {
  const { user, loading } = useContext(AuthContext);
  if (loading) return null;
  if (!user) return <Navigate to="/login" />;
  if (roles.length) {
    const r = String(user.role || "").toUpperCase();
    const ok = roles.map((x) => String(x).toUpperCase()).includes(r);
    if (!ok) return <Navigate to="/" />;
  }
  return children;
};

const AppRoutes = () => (
  <Router>
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
      <Route index element={<DashboardHome />} /> */}
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Dashboard />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardHome />} />
        <Route path="attendance" element={<Attendance />} />
        <Route path="route" element={<RoutePlan />} />
        <Route path="add" element={<RouteForm />} />
        <Route path="route/add" element={<RouteForm />} />
        <Route path="route/edit/:id" element={<RouteForm />} />
        <Route path="visit" element={<Visit />} />
        <Route path="order" element={<Order />} />
        <Route path="order/add" element={<OrderForm />} />
        <Route path="order/edit/:id" element={<OrderForm />} />
        <Route path="expense" element={<Expense />} />
        <Route path="/expense/add" element={<ExpenseForm />} />
        <Route path="collection" element={<Collection />} />
        <Route path="/collection/add" element={<CollectionForm />} />

        {/* Admin-only master data */}
        <Route
          path="users"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <User />
            </RoleRoute>
          }
        />
        <Route
          path="users/add"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <UserForm />
            </RoleRoute>
          }
        />
        <Route
          path="users/edit/:id"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <UserForm />
            </RoleRoute>
          }
        />

        <Route path="customer" element={<Customer />} />
        <Route
          path="customer/add"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <CustomerForm />
            </RoleRoute>
          }
        />
        <Route
          path="customer/edit/:id"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <CustomerForm />
            </RoleRoute>
          }
        />

        <Route path="product" element={<Product />} />
        <Route
          path="product/add"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <ProductForm />
            </RoleRoute>
          }
        />
        <Route
          path="product/edit/:id"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <ProductForm />
            </RoleRoute>
          }
        />

        <Route
          path="company"
          element={
            <RoleRoute roles={["ADMIN", "MANAGER"]}>
              <Company />
            </RoleRoute>
          }
        />
        <Route
          path="company/add"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <CompanyForm />
            </RoleRoute>
          }
        />
        <Route
          path="company/edit/:id"
          element={
            <RoleRoute roles={["ADMIN"]}>
              <CompanyForm />
            </RoleRoute>
          }
        />

        <Route
  path="assignments/user-company"
  element={
    <RoleRoute roles={["ADMIN", "MANAGER"]}>
      <UserCompanyAssignment />
    </RoleRoute>
  }
/>

        <Route
          path="assignments/customers"
          element={
            <RoleRoute roles={["ADMIN", "MANAGER"]}>
              <CustomerAssignment />
            </RoleRoute>
          }
        />

        <Route
          path="reports"
          element={
            <RoleRoute roles={["ADMIN", "MANAGER"]}>
              <Reports />
            </RoleRoute>
          }
        />

        <Route
  path="reports/sales"
  element={
    <RoleRoute roles={["ADMIN", "MANAGER"]}>
      <SalesReport />
    </RoleRoute>
  }
/>
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Router>
);

export default AppRoutes;
