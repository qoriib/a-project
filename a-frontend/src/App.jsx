import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Layout & Common
import DashboardLayout from "./components/layout/DashboardLayout";
import { RoleRoute } from "./components/common";

// Auth
import { Login } from "./pages/auth";

// Dashboard
import { Dashboard } from "./pages/dashboard";

// Vendors
import {
  VendorList,
  ExistingVendor,
  AddExistingVendor,
  NewVendor,
  AddVendor,
  EditVendor,
  VendorDetail,
  VendorRequest,
  VerifyVendor,
} from "./pages/vendors";

// Approvals & Workflow Stages
import {
  Approval,
  ApprovalDetail,
  KadivRequester,
  ProcurementDetail,
  Account,
  AccountDetail,
  Tax,
  TaxDetail,
  Sap,
  SapDetail,
  SapHistory,
} from "./pages/approvals";

// Users
import { ManageUser, UserDetail } from "./pages/users";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC ROUTES */}
        <Route path="/login" element={<Login />} />
        <Route path="/verify-vendor/:token" element={<VerifyVendor />} />

        {/* DEFAULT ROOT REDIRECT TO LOGIN */}
        <Route path="/" element={<Navigate to="/login" replace />} />

        {/* MAIN APPLICATION (DASHBOARD LAYOUT) */}
        <Route element={<DashboardLayout />}>
          {/* Overview Dashboard - Seluruh pengguna terautentikasi */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* Master Vendor - Seluruh pengguna terautentikasi dapat melihat daftar vendor */}
          <Route path="/vendors/all" element={<VendorList />} />
          <Route path="/vendors/detail/:id" element={<VendorDetail />} />

          {/* Rute Khusus Requester & Admin (Input Form Vendor & Import) */}
          <Route element={<RoleRoute allowedRoles={["REQUESTER"]} />}>
            <Route path="/vendors/add" element={<NewVendor />} />
            <Route path="/vendors/add/new" element={<AddVendor />} />
            <Route path="/vendors/existing" element={<ExistingVendor />} />
            <Route path="/vendors/existing/add" element={<AddExistingVendor />} />
            <Route path="/vendors/edit/:id" element={<EditVendor />} />
            <Route path="/vendors-requests" element={<VendorRequest />} />
          </Route>

          {/* Rute Khusus Approver & Admin (Alur Approval 5 Level) */}
          <Route element={<RoleRoute allowedRoles={["APPROVER"]} />}>
            <Route path="/approval" element={<Approval />} />
            <Route path="/approval/:id" element={<ApprovalDetail />} />
            <Route path="/procurement/:id" element={<ProcurementDetail />} />
            <Route path="/vendor-requests/:id" element={<KadivRequester />} />

            {/* Level 3: Accounting */}
            <Route path="/account" element={<Account />} />
            <Route path="/account/:id" element={<AccountDetail />} />

            {/* Level 4: Tax */}
            <Route path="/tax" element={<Tax />} />
            <Route path="/tax/:id" element={<TaxDetail />} />

            {/* Level 5: SAP */}
            <Route path="/sap" element={<Sap />} />
            <Route path="/sap/:id" element={<SapDetail />} />
            <Route path="/sap-history" element={<SapHistory />} />
          </Route>

          {/* Rute Khusus Administrator (User Management) */}
          <Route element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route path="/user" element={<ManageUser />} />
            <Route path="/user/:id" element={<UserDetail />} />
            <Route path="/master-approvals" element={<ManageUser />} />
          </Route>
        </Route>

        {/* CATCH-ALL REDIRECT TO LOGIN */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
