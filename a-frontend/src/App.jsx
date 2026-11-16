import { BrowserRouter, Routes, Route } from "react-router-dom";

import Login from "./login";
import DashboardLayout from "./component/dashboardLayout";
import Dashboard from "./dashboard";
import AddVendor from "./AddVendor";
import VendorList from "./vendorList";
import EditVendor from "./editVendor";
import ExistingVendor from "./existingVendor";
import AddExistingVendor from "./addExistingVendor";
import NewVendor from "./newVendor";
import ManageUser from "./manageUser";
import UserDetail from "./userDetail";
import VendorRequest from "./VendorRequest";
import KadivRequester from "./KadivRequester";
import Account from "./Account";
import AccountDetail from "./AccountDetail";
import ProcurementDetail from "./ProcurementDetail";
import Tax from "./Tax";
import TaxDetail from "./TaxDetail";
import Sap from "./Sap";
import SapDetail from "./SapDetail";
import Approval from "./Approval";
import ApprovalDetail from "./ApprovalDetail";
import SapHistory from "./SapHistory";
import VerifyVendor from "./VerifyVendor";
import VendorDetail from "./VendorDetail";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* LOGIN - TANPA SIDEBAR */}
        <Route path="/login" element={<Login />} />

        {/* SEMUA HALAMAN DASHBOARD MENGGUNAKAN LAYOUT */}
        <Route element={<DashboardLayout />}>
          {/* Dashboard */}
          <Route path="/dashboard" element={<Dashboard />} />

          {/* list Vendor */}
          <Route path="/vendors/all" element={<VendorList />} />

          {/* edit Vendor */}
          <Route path="/vendors/edit/:id" element={<EditVendor />} />

          <Route path="/vendors/detail/:id" element={<VendorDetail />} />

          <Route path="/vendors/existing" element={<ExistingVendor />} />

          <Route path="/vendors/existing/add" element={<AddExistingVendor />} />

          <Route path="/vendors/add" element={<NewVendor />} />

          {/* Tambah Vendor */}
          <Route path="/vendors/add/new" element={<AddVendor />} />

          <Route path="/user" element={<ManageUser />} />

          <Route path="/user/:id" element={<UserDetail />} />

          <Route path="/vendors-requests" element={<VendorRequest />} />

          <Route path="/tax/:id" element={<TaxDetail />} />

          <Route path="/sap" element={<Sap />} />
          <Route path="/sap/:id" element={<SapDetail />} />
          <Route path="/sap-history" element={<SapHistory />} />

          <Route path="/vendor-requests/:id" element={<KadivRequester />} />

          <Route path="/account" element={<Account />} />
          <Route path="/tax" element={<Tax />} />

          <Route path="/account/:id" element={<AccountDetail />} />

          <Route path="/procurement/:id" element={<ProcurementDetail />} />

          <Route path="/approval" element={<Approval />} />
          <Route path="/approval/:id" element={<ApprovalDetail />} />
          <Route path="/verify-vendor/:token" element={<VerifyVendor />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
