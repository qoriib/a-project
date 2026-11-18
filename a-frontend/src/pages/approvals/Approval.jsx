import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import "./Approval.css";
import { API_BASE_URL, getAuthHeaders } from "../../api/config";

function Approval() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const typeParam = (searchParams.get("type") || "").toUpperCase();
  const requestType = typeParam === "UPDATE" || typeParam === "EXISTING" ? "UPDATE" : "NEW";

  const [requests, setRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);
  const [rejectedRequests, setRejectedRequests] = useState([]);

  const tabParam = (searchParams.get("tab") || "").toUpperCase();
  const [activeTab, setActiveTab] = useState(
    tabParam === "HISTORY"
      ? "HISTORY"
      : tabParam === "REJECTED"
        ? "REJECTED"
        : "PROCESS"
  );
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [rejectedLoading, setRejectedLoading] = useState(false);

  const [stagePermissions, setStagePermissions] = useState({});
  const [isAdmin, setIsAdmin] = useState(false);

  // =========================================================
  // CARD APPROVAL
  // =========================================================

  const allApprovalCards = [
    {
      value: "ALL",
      label: "Semua",
      description: "Seluruh pengajuan aktif",
      stage: null,
      statuses: null,
      permission: "all",
    },
    {
      value: "REQUESTER",
      label: "Requester",
      description: "Draft dan revisi pengajuan",
      stage: "REQUESTER",
      statuses: ["DRAFT", "Pending", "Rejected", "REJECTED"],
      permission: "can_edit",
    },
    {
      value: "ASISTEN_KADIV",
      label: "Asisten Kadiv (L1)",
      description: "Verifikasi dokumen vendor",
      stage: "ASISTEN_KADIV",
      statuses: ["PENDING_L1", "Pending", "Under Review", "IN_PROGRESS"],
      permission: "can_approve",
    },
    {
      value: "KADIV_REQUESTER",
      label: "Kadiv SCM (L2)",
      description: "Approval pengajuan vendor SCM",
      stage: "KADIV",
      statuses: ["PENDING_L2", "Pending", "Under Review", "IN_PROGRESS"],
      permission: "can_approve",
    },
    {
      value: "ACCOUNTING",
      label: "Accounting (L3)",
      description: "Input Account Group & Recon Account",
      stage: "ACCOUNTING",
      statuses: [
        "PENDING_L3",
        "Pending",
        "Under Review",
        "IN_PROGRESS",
        "Rejected",
        "Revision Required",
        "Draft",
        "DRAFT",
      ],
      permission: "can_edit",
    },
    {
      value: "TAX",
      label: "Tax (L4)",
      description: "Input Withholding Tax (PPh)",
      stage: "TAX",
      statuses: [
        "PENDING_L4",
        "Pending",
        "Under Review",
        "IN_PROGRESS",
        "Rejected",
        "Revision Required",
        "Draft",
        "DRAFT",
      ],
      permission: "can_edit",
    },
    {
      value: "SAP",
      label: "SAP Team (L5)",
      description: "Review Full Form & Input SAP Code",
      stage: "SAP",
      statuses: [
        "PENDING_L5",
        "FORM_APPROVED",
        "Pending",
        "Under Review",
        "IN_PROGRESS",
        "Rejected",
        "Revision Required",
        "Draft",
        "DRAFT",
      ],
      permission: "can_edit",
    },
  ];

  // =========================================================
  // CARD SESUAI HAK AKSES USER
  // =========================================================

  const approvalCards = useMemo(() => {
    let storedUser = {};
    try {
      storedUser = JSON.parse(localStorage.getItem("user") || "{}");
    } catch {
      storedUser = {};
    }

    const userRole = String(
      storedUser?.role || storedUser?.role_name || ""
    ).toUpperCase().trim();

    const isUserAdmin = isAdmin || storedUser?.is_admin === true || userRole === "ADMIN";

    if (isUserAdmin) {
      return allApprovalCards;
    }

    const roleStageMapping = {
      ASISTEN_KADIV: ["ASISTEN_KADIV"],
      KADIV: ["KADIV"],
      ACCOUNTING: ["ACCOUNTING"],
      TAX: ["TAX"],
      SAP: ["SAP"],
      REQUESTER: ["REQUESTER"],
      PROCUREMENT: ["REQUESTER"],
    };

    const allowedStages = roleStageMapping[userRole] || null;

    return allApprovalCards.filter((card) => {
      if (card.value === "ALL") {
        return false;
      }

      // Pembatasan ketat: tiap role hanya dapat mengakses card miliknya sendiri
      if (allowedStages && !allowedStages.includes(card.stage)) {
        return false;
      }

      const permission = stagePermissions[card.stage];

      if (!permission) {
        return false;
      }

      return (
        permission.can_edit === true ||
        permission.can_approve === true ||
        permission.can_view === true
      );
    });
  }, [stagePermissions, isAdmin]);

  // =========================================================
  // FETCH REQUEST BERDASARKAN STAGE (DALAM PROSES)
  // =========================================================

  const fetchRequests = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        throw new Error("Token login tidak ditemukan.");
      }

      const stageList = [
        "REQUESTER",
        "ASISTEN_KADIV",
        "KADIV",
        "ACCOUNTING",
        "TAX",
        "SAP",
      ];

      const responses = await Promise.all(
        stageList.map(async (stage) => {
          try {
            const response = await fetch(
              `${API_BASE_URL}/vendor-requests/stage/${stage}?type=${requestType}`,
              {
                headers: getAuthHeaders(false),
              },
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
              return {
                stage,
                data: [],
                permissions: null,
              };
            }

            return {
              stage,
              data: Array.isArray(result.data) ? result.data : [],
              permissions: result.permissions || null,
            };
          } catch {
            return {
              stage,
              data: [],
              permissions: null,
            };
          }
        }),
      );

      const permissionMap = {};

      responses.forEach((result) => {
        if (result.permissions) {
          permissionMap[result.stage] = result.permissions;
        }
      });

      setStagePermissions(permissionMap);

      const admin = responses.some(
        (result) => result.permissions?.is_admin === true,
      );

      setIsAdmin(admin);

      const combinedRequests = responses.flatMap((result) => result.data);

      const uniqueRequests = Array.from(
        new Map(
          combinedRequests.map((request) => [request.id, request]),
        ).values(),
      );

      const activeRequests = uniqueRequests.filter(
        (request) =>
          request.current_stage !== "COMPLETED" &&
          request.status !== "Approved" &&
          request.status !== "COMPLETED" &&
          request.status !== "DONE",
      );

      setRequests(activeRequests);
    } catch (error) {
      console.error("Error mengambil data approval:", error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FETCH HISTORY APPROVED
  // =========================================================

  const fetchHistory = async () => {
    setHistoryLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/completed?type=${requestType}`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil History Approved.");
      }

      const completedRequests = (Array.isArray(data) ? data : []).filter(
        (request) => {
          const stage = String(request.current_stage || "").toUpperCase().trim();
          const status = String(request.status || "").toUpperCase().trim();

          return (
            stage === "COMPLETED" ||
            status === "COMPLETED" ||
            status === "APPROVED" ||
            status === "DONE"
          );
        },
      );

      setHistoryRequests(completedRequests);
    } catch (error) {
      console.error("Error mengambil history:", error);
      setHistoryRequests([]);
    } finally {
      setHistoryLoading(false);
    }
  };

  // =========================================================
  // FETCH HISTORY REJECTED
  // =========================================================

  const fetchRejected = async () => {
    setRejectedLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) return;

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/rejected?type=${requestType}`,
        {
          headers: getAuthHeaders(false),
        },
      );

      const data = await response.json().catch(() => []);

      if (!response.ok) {
        throw new Error(data.message || "Gagal mengambil History Rejected.");
      }

      setRejectedRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error mengambil history rejected:", error);
      setRejectedRequests([]);
    } finally {
      setRejectedLoading(false);
    }
  };

  // =========================================================
  // INITIAL LOAD: LOAD DALAM PROSES, HISTORY APPROVED, & REJECTED
  // =========================================================

  useEffect(() => {
    fetchRequests();
    fetchHistory();
    fetchRejected();
  }, [requestType]);

  useEffect(() => {
    if (activeTab === "HISTORY" && historyRequests.length === 0 && !historyLoading) {
      fetchHistory();
    }
    if (activeTab === "REJECTED" && rejectedRequests.length === 0 && !rejectedLoading) {
      fetchRejected();
    }
  }, [activeTab]);

  // =========================================================
  // JUMLAH REQUEST SETIAP CARD
  // =========================================================

  const cardCounts = useMemo(() => {
    const counts = {};

    approvalCards.forEach((card) => {
      if (card.value === "ALL") {
        counts[card.value] = requests.length;
        return;
      }

      counts[card.value] = requests.filter((request) => {
        const matchesStage =
          request.current_stage === card.stage ||
          (card.stage === "REQUESTER" &&
            (request.current_stage === "REJECTED" ||
              request.status === "Rejected" ||
              request.status === "REJECTED"));

        return (
          matchesStage &&
          (!card.statuses || card.statuses.includes(request.status))
        );
      }).length;
    });

    return counts;
  }, [requests, approvalCards]);

  // =========================================================
  // CARD YANG SEDANG DIPILIH
  // =========================================================

  const selectedCard =
    approvalCards.find((card) => card.value === cardFilter) ||
    approvalCards[0] ||
    null;

  useEffect(() => {
    if (!approvalCards.some((card) => card.value === cardFilter)) {
      setCardFilter(approvalCards[0]?.value || "");
    }
  }, [approvalCards, cardFilter]);

  // =========================================================
  // FILTER REQUEST DAN SEARCH
  // =========================================================

  const filteredRequests = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return requests.filter((request) => {
      const vendor = request.vendor || {};

      if (!selectedCard) {
        return false;
      }

      // FILTER CARD
      if (selectedCard.value !== "ALL") {
        const matchesStage =
          request.current_stage === selectedCard.stage ||
          (selectedCard.stage === "REQUESTER" &&
            (request.current_stage === "REJECTED" ||
              request.status === "Rejected" ||
              request.status === "REJECTED"));

        if (!matchesStage) {
          return false;
        }

        if (
          selectedCard.statuses &&
          !selectedCard.statuses.includes(request.status)
        ) {
          return false;
        }
      }

      // SEARCH
      if (!keyword) return true;

      const searchableValues = [
        vendor.vendor_code,
        vendor.nama_perusahaan,
        vendor.pic_vendor,
        vendor.email,
        request.id,
      ];

      return searchableValues
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(keyword));
    });
  }, [requests, search, selectedCard]);

  // =========================================================
  // LABEL STAGE
  // =========================================================

  const getStageLabel = (stage) => {
    switch (stage) {
      case "REQUESTER":
        return "Requester";

      case "ACCOUNTING":
        return "Accounting";

      case "TAX":
        return "Tax";

      case "SAP":
        return "SAP";

      case "COMPLETED":
        return "Completed";

      default:
        return stage || "-";
    }
  };

  // =========================================================
  // CLASS STAGE
  // =========================================================

  const getStageClass = (stage) => {
    switch (stage) {
      case "REQUESTER":
        return "approval-stage requester";

      case "ACCOUNTING":
        return "approval-stage accounting";

      case "TAX":
        return "approval-stage tax";

      case "SAP":
        return "approval-stage sap";

      default:
        return "approval-stage";
    }
  };

  // =========================================================
  // CLASS STATUS
  // =========================================================

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
      case "PENDING_L1":
      case "PENDING_L2":
      case "PENDING_L3":
      case "PENDING_L4":
      case "PENDING_L5":
        return "approval-status pending";

      case "Under Review":
      case "FORM_APPROVED":
        return "approval-status review";

      case "Approved":
      case "COMPLETED":
        return "approval-status approved";

      case "Rejected":
      case "REJECTED":
      case "Revision Required":
        return "approval-status rejected";

      default:
        return "approval-status";
    }
  };

  // =========================================================
  // DETAIL REQUEST
  // =========================================================

  const handleDetail = (request) => {
    const requestId = request.id;

    switch (request.current_stage) {
      case "REQUESTER":
        navigate(`/procurement/${requestId}`);
        break;

      case "ASISTEN_KADIV":
      case "KADIV":
        navigate(`/vendor-requests/${requestId}`);
        break;

      case "ACCOUNTING":
        navigate(`/account/${requestId}`);
        break;

      case "TAX":
        navigate(`/tax/${requestId}`);
        break;

      case "SAP":
        navigate(`/sap/${requestId}`);
        break;

      default:
        navigate(`/vendor-requests/${requestId}`);
    }
  };

  // =========================================================
  // VIEW PDF
  // =========================================================

  const handleViewPdf = async (requestId) => {
    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Session login tidak ditemukan. Silakan login kembali.");
        return;
      }

      const response = await fetch(
        `${API_BASE_URL}/vendor-requests/${requestId}/pdf`,
        {
          method: "GET",
          headers: getAuthHeaders(false, { Accept: "application/pdf" }),
        },
      );

      if (!response.ok) {
        const errorText = await response.text();

        console.error("Gagal mengambil PDF:", errorText);

        alert("PDF gagal dibuka. Silakan cek koneksi atau endpoint PDF.");

        return;
      }

      const blob = await response.blob();
      const pdfUrl = window.URL.createObjectURL(blob);

      window.open(pdfUrl, "_blank");

      setTimeout(() => {
        window.URL.revokeObjectURL(pdfUrl);
      }, 60000);
    } catch (error) {
      console.error("Error membuka PDF:", error);

      alert("Terjadi kesalahan saat membuka PDF.");
    }
  };

  // =========================================================
  // SEARCH ENTER
  // =========================================================

  const handleSearchKeyDown = (event) => {
    if (event.key !== "Enter") return;

    const keyword = search.trim().toLowerCase();

    if (!keyword) return;

    const foundRequest = filteredRequests.find((request) => {
      const vendor = request.vendor || {};

      return (
        String(vendor.vendor_code || "").toLowerCase() === keyword ||
        String(vendor.nama_perusahaan || "").toLowerCase() === keyword
      );
    });

    if (foundRequest) {
      handleDetail(foundRequest);
    } else {
      alert("Vendor tidak ditemukan pada card yang dipilih.");
    }
  };

  // =========================================================
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="approval-page">
        <div className="approval-loading">
          <div className="approval-loading-spinner"></div>
          <p>Memuat data approval...</p>
        </div>
      </div>
    );
  }

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="approval-page">
      {/* HEADER */}

      <div className="approval-header">
        <div className="approval-header-left">
          <div className="approval-header-icon">✓</div>

          <div>
            <h2>{requestType === "UPDATE" ? "Approval Existing Vendor" : "Approval New Vendor"}</h2>
            <p>
              {requestType === "UPDATE"
                ? "Kelola dan proses persetujuan pembaruan data vendor yang sudah terdaftar berdasarkan tahapan workflow."
                : "Kelola dan proses persetujuan pengajuan vendor baru berdasarkan tahapan workflow."}
            </p>
          </div>
        </div>

        {/* SEARCH */}

        <div className="approval-search">
          <div className="approval-search-box">
            <span className="approval-search-icon">🔍</span>

            <input
              type="text"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder={
                activeTab === "HISTORY"
                  ? "Cari vendor atau Vendor Code..."
                  : "Cari vendor..."
              }
            />

            {search && (
              <button
                type="button"
                className="approval-search-clear"
                onClick={() => setSearch("")}
              >
                ×
              </button>
            )}
          </div>
        </div>
      </div>

      {/* TAB */}

      <div className="approval-tabs">
        <button
          type="button"
          className={`approval-tab ${activeTab === "PROCESS" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("PROCESS");
            setSearch("");
            setCardFilter("ALL");
            setSearchParams(requestType === "UPDATE" ? { type: "UPDATE" } : {});
          }}
        >
          Dalam Proses
          <span>{requests.length}</span>
        </button>

        <button
          type="button"
          className={`approval-tab ${activeTab === "HISTORY" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("HISTORY");
            setSearch("");
            setCardFilter("ALL");
            setSearchParams({ tab: "HISTORY", ...(requestType === "UPDATE" ? { type: "UPDATE" } : {}) });
          }}
        >
          History Approved
          <span>{historyRequests.length}</span>
        </button>

        <button
          type="button"
          className={`approval-tab ${activeTab === "REJECTED" ? "active" : ""}`}
          onClick={() => {
            setActiveTab("REJECTED");
            setSearch("");
            setCardFilter("ALL");
            setSearchParams({ tab: "REJECTED", ...(requestType === "UPDATE" ? { type: "UPDATE" } : {}) });
          }}
        >
          History Rejected
          <span>{rejectedRequests.length}</span>
        </button>
      </div>

      {/* =====================================================
          DALAM PROSES
      ===================================================== */}

      {activeTab === "PROCESS" && (
        <>
          {/* APPROVAL CARDS */}

          <div className="approval-workflow">
            {approvalCards.map((card, index) => (
              <button
                key={card.value}
                type="button"
                className={`approval-workflow-card ${card.value === "ALL"
                  ? "stage-all"
                  : `stage-${card.value.toLowerCase()}`
                  } ${cardFilter === card.value ? "active" : ""}`}
                onClick={() => setCardFilter(card.value)}
              >
                <div className="workflow-card-number">
                  {cardCounts[card.value] ?? 0}
                </div>

                <div className="workflow-card-content">
                  <strong>{card.label}</strong>
                  <span>{card.description}</span>
                </div>

                {index < approvalCards.length - 1 && (
                  <span className="workflow-arrow" aria-hidden="true">
                    →
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* LIST REQUEST */}

          <div className="approval-list-card">
            <div className="approval-list-header">
              <div>
                <h4>{selectedCard.label}</h4>
                <p>{selectedCard.description}</p>
              </div>

              <div className="approval-list-total">
                <strong>{filteredRequests.length}</strong>
                <span>Pengajuan</span>
              </div>
            </div>

            {filteredRequests.length === 0 ? (
              <div className="approval-empty">
                <div className="approval-empty-icon">✓</div>

                <h5>Tidak ada pengajuan</h5>

                <p>Belum ada vendor pada card yang dipilih.</p>
              </div>
            ) : (
              <div className="approval-table-wrapper">
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th width="55">No</th>
                      <th>Vendor</th>
                      <th>PIC Vendor</th>
                      <th>Email</th>
                      <th>Tahap</th>
                      <th>Status</th>
                      <th width="100">PDF</th>
                      <th width="100">Aksi</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRequests.map((request, index) => {
                      const vendor = request.vendor || {};

                      return (
                        <tr key={request.id}>
                          <td>
                            <span className="approval-number">{index + 1}</span>
                          </td>

                          <td>
                            <div className="approval-vendor">
                              <strong>{vendor.nama_perusahaan || "-"}</strong>

                              <span>
                                {vendor.vendor_code || "Vendor Code belum ada"}
                              </span>
                            </div>
                          </td>

                          <td>{vendor.pic_vendor || "-"}</td>

                          <td>{vendor.email || "-"}</td>

                          <td>
                            <span
                              className={getStageClass(request.current_stage)}
                            >
                              {getStageLabel(request.current_stage)}
                            </span>
                          </td>

                          <td>
                            <span className={getStatusClass(request.status)}>
                              {request.status === "FORM_APPROVED"
                                ? "Menunggu Kode SAP"
                                : request.status || "-"}
                            </span>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="approval-pdf-button"
                              onClick={() => handleViewPdf(request.id)}
                            >
                              📄 PDF
                            </button>
                          </td>

                          <td>
                            {request.status !== "Rejected" &&
                              request.status !== "Approved" &&
                              request.current_stage !== "COMPLETED" && (
                                <button
                                  type="button"
                                  className="approval-process-button"
                                  onClick={() => handleDetail(request)}
                                >
                                  {request.current_stage === "REQUESTER"
                                    ? "Lanjutkan Draft"
                                    : request.status === "FORM_APPROVED"
                                    ? "Input Kode SAP"
                                    : "Proses"}{" "}
                                  <span>→</span>
                                </button>
                              )}

                            {request.status === "Rejected" && (
                              <button
                                type="button"
                                className="approval-process-button"
                                onClick={() => handleDetail(request)}
                              >
                                Revisi / Detail <span>→</span>
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* =====================================================
          HISTORY APPROVED
      ===================================================== */}

      {activeTab === "HISTORY" && (
        <div className="approval-list-card">
          <div className="approval-list-header">
            <div>
              <h4>History Approved</h4>

              <p>
                Daftar pengajuan vendor baru yang telah selesai diproses sampai
                tahap SAP.
              </p>
            </div>

            <div className="approval-list-total">
              <strong>
                {
                  historyRequests.filter((request) => {
                    const vendor = request.vendor || {};
                    const keyword = search.trim().toLowerCase();

                    return [
                      vendor.nama_perusahaan,
                      vendor.vendor_code,
                      vendor.pic_vendor,
                      vendor.email,
                      request.vendor_code,
                      request.id,
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(keyword);
                  }).length
                }
              </strong>

              <span>Pengajuan</span>
            </div>
          </div>

          {historyLoading ? (
            <div className="approval-loading">
              <div className="approval-loading-spinner"></div>
              <p>Memuat History Approved...</p>
            </div>
          ) : (
            <div className="approval-table-wrapper">
              <table className="approval-table">
                <thead>
                  <tr>
                    <th width="55">No</th>
                    <th>Vendor</th>
                    <th>Vendor Code</th>
                    <th>PIC Vendor</th>
                    <th>Email</th>
                    <th>Tanggal Selesai</th>
                    <th width="120">PDF</th>
                    <th width="100">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {historyRequests
                    .filter((request) => {
                      const vendor = request.vendor || {};
                      const keyword = search.trim().toLowerCase();

                      return [
                        vendor.vendor_code,
                        vendor.nama_perusahaan,
                        vendor.pic_vendor,
                        vendor.email,
                        request.id,
                      ]
                        .filter(Boolean)
                        .some((value) =>
                          String(value).toLowerCase().includes(keyword),
                        );
                    })
                    .map((request, index) => {
                      const vendor = request.vendor || {};

                      const vendorCode =
                        request.vendor_code || vendor.vendor_code || "-";

                      const completedAt = request.completed_at
                        ? new Date(request.completed_at).toLocaleString(
                          "id-ID",
                          {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          },
                        )
                        : "-";

                      return (
                        <tr key={request.id}>
                          <td>
                            <span className="approval-number">{index + 1}</span>
                          </td>

                          <td>
                            <div className="approval-vendor">
                              <strong>{vendor.nama_perusahaan || "-"}</strong>
                              <span>Request #{request.id}</span>
                            </div>
                          </td>

                          <td>
                            <strong>{vendorCode}</strong>
                          </td>

                          <td>{vendor.pic_vendor || "-"}</td>

                          <td>{vendor.email || "-"}</td>

                          <td>{completedAt}</td>

                          <td>
                            <button
                              type="button"
                              className="approval-pdf-button"
                              onClick={() => handleViewPdf(request.id)}
                            >
                              📄 PDF
                            </button>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="existing-detail-button"
                              onClick={() => navigate(`/sap/${request.id}`)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                  {!historyLoading &&
                    historyRequests.filter((request) => {
                      const vendor = request.vendor || {};
                      const keyword = search.trim().toLowerCase();

                      return [
                        vendor.nama_perusahaan,
                        vendor.vendor_code,
                        vendor.pic_vendor,
                        vendor.email,
                        request.vendor_code,
                        request.id,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(keyword);
                    }).length === 0 && (
                      <tr>
                        <td colSpan="8">
                          <div className="approval-empty">
                            <div className="approval-empty-icon">✓</div>

                            <h5>Belum ada History Approved</h5>

                            <p>
                              Data vendor yang sudah selesai diproses SAP akan
                              muncul di sini.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* =====================================================
          HISTORY REJECTED
      ===================================================== */}

      {activeTab === "REJECTED" && (
        <div className="approval-list-card">
          <div className="approval-list-header">
            <div>
              <h4>History Rejected</h4>

              <p>
                Daftar pengajuan vendor yang ditolak atau memerlukan revisi oleh
                Requester.
              </p>
            </div>

            <div className="approval-list-total">
              <strong>
                {
                  rejectedRequests.filter((request) => {
                    const vendor = request.vendor || {};
                    const keyword = search.trim().toLowerCase();

                    return [
                      vendor.nama_perusahaan,
                      vendor.vendor_code,
                      vendor.pic_vendor,
                      vendor.email,
                      request.form_number,
                      request.rejection_reason,
                      request.id,
                    ]
                      .filter(Boolean)
                      .join(" ")
                      .toLowerCase()
                      .includes(keyword);
                  }).length
                }
              </strong>

              <span>Pengajuan Ditolak</span>
            </div>
          </div>

          {rejectedLoading ? (
            <div className="approval-loading">
              <div className="approval-loading-spinner"></div>
              <p>Memuat History Rejected...</p>
            </div>
          ) : (
            <div className="approval-table-wrapper">
              <table className="approval-table">
                <thead>
                  <tr>
                    <th width="50">No</th>
                    <th>Vendor</th>
                    <th>PIC Vendor</th>
                    <th>Email</th>
                    <th>Tahap Ditolak</th>
                    <th>Alasan Penolakan</th>
                    <th>Tanggal Ditolak</th>
                    <th width="100">PDF</th>
                    <th width="100">Aksi</th>
                  </tr>
                </thead>

                <tbody>
                  {rejectedRequests
                    .filter((request) => {
                      const vendor = request.vendor || {};
                      const keyword = search.trim().toLowerCase();

                      return [
                        vendor.nama_perusahaan,
                        vendor.vendor_code,
                        vendor.pic_vendor,
                        vendor.email,
                        request.form_number,
                        request.rejection_reason,
                        request.id,
                      ]
                        .filter(Boolean)
                        .some((value) =>
                          String(value).toLowerCase().includes(keyword),
                        );
                    })
                    .map((request, index) => {
                      const vendor = request.vendor || {};

                      const rejectedAt = request.updated_at
                        ? new Date(request.updated_at).toLocaleString("id-ID", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : "-";

                      const latestRejectHistory = (request.approvalHistories || [])
                        .filter(
                          (h) =>
                            String(h.status || "").toUpperCase() === "REJECTED",
                        )
                        .pop();

                      const rejectStage =
                        latestRejectHistory?.approval_stage ||
                        request.current_stage ||
                        "-";

                      const rejectReason =
                        request.rejection_reason ||
                        latestRejectHistory?.notes ||
                        "-";

                      return (
                        <tr key={request.id}>
                          <td>
                            <span className="approval-number">{index + 1}</span>
                          </td>

                          <td>
                            <div className="approval-vendor">
                              <strong>{vendor.nama_perusahaan || "-"}</strong>
                              <span>
                                {request.form_number || `Request #${request.id}`}
                              </span>
                            </div>
                          </td>

                          <td>{vendor.pic_vendor || "-"}</td>

                          <td>{vendor.email || "-"}</td>

                          <td>
                            <span className="badge bg-light text-dark border">
                              {getStageLabel(rejectStage)}
                            </span>
                          </td>

                          <td>
                            <div
                              style={{
                                maxWidth: "260px",
                                wordBreak: "break-word",
                                color: "#b91c1c",
                                fontSize: "12px",
                              }}
                              title={rejectReason}
                            >
                              {rejectReason}
                            </div>
                          </td>

                          <td>{rejectedAt}</td>

                          <td>
                            <button
                              type="button"
                              className="approval-pdf-button"
                              onClick={() => handleViewPdf(request.id)}
                            >
                              📄 PDF
                            </button>
                          </td>

                          <td>
                            <button
                              type="button"
                              className="existing-detail-button"
                              onClick={() => handleDetail(request)}
                            >
                              Detail
                            </button>
                          </td>
                        </tr>
                      );
                    })}

                  {!rejectedLoading &&
                    rejectedRequests.filter((request) => {
                      const vendor = request.vendor || {};
                      const keyword = search.trim().toLowerCase();

                      return [
                        vendor.nama_perusahaan,
                        vendor.vendor_code,
                        vendor.pic_vendor,
                        vendor.email,
                        request.form_number,
                        request.rejection_reason,
                        request.id,
                      ]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase()
                        .includes(keyword);
                    }).length === 0 && (
                      <tr>
                        <td colSpan="9">
                          <div className="approval-empty">
                            <div className="approval-empty-icon">✓</div>

                            <h5>Belum ada History Rejected</h5>

                            <p>
                              Tidak ada pengajuan vendor yang berstatus ditolak.
                            </p>
                          </div>
                        </td>
                      </tr>
                    )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default Approval;
