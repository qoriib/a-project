import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";
import "./Approval.css";

function Approval() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState([]);
  const [historyRequests, setHistoryRequests] = useState([]);

  const [activeTab, setActiveTab] = useState("PROCESS");
  const [search, setSearch] = useState("");
  const [cardFilter, setCardFilter] = useState("ALL");

  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(false);

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
      statuses: ["Pending", "Rejected", "Revision Required"],
      permission: "can_edit",
    },
    {
      value: "KADIV_REQUESTER",
      label: "Kadiv Requester",
      description: "Approval pengajuan vendor",
      stage: "REQUESTER",
      statuses: ["Under Review"],
      permission: "can_approve",
    },
    {
      value: "ACCOUNTING",
      label: "Accounting",
      description: "Draft data accounting",
      stage: "ACCOUNTING",
      statuses: ["Pending", "Rejected", "Revision Required"],
      permission: "can_edit",
    },
    {
      value: "KADIV_ACCOUNTING",
      label: "Kadiv Accounting",
      description: "Approval accounting",
      stage: "ACCOUNTING",
      statuses: ["Under Review"],
      permission: "can_approve",
    },
    {
      value: "TAX",
      label: "Tax",
      description: "Draft data perpajakan",
      stage: "TAX",
      statuses: ["Pending", "Rejected", "Revision Required"],
      permission: "can_edit",
    },
    {
      value: "KADIV_TAX",
      label: "Kadiv Tax",
      description: "Approval perpajakan",
      stage: "TAX",
      statuses: ["Under Review"],
      permission: "can_approve",
    },
    {
      value: "SAP",
      label: "SAP",
      description: "Proses Vendor Code",
      stage: "SAP",
      statuses: ["Pending", "Rejected", "Revision Required"],
      permission: "can_edit",
    },
  ];

  // =========================================================
  // CARD SESUAI HAK AKSES USER
  // =========================================================

  const approvalCards = useMemo(() => {
    if (isAdmin) {
      return allApprovalCards;
    }

    return allApprovalCards.filter((card) => {
      if (card.value === "ALL") {
        return false;
      }

      const permission = stagePermissions[card.stage];

      if (!permission) {
        return false;
      }

      return permission[card.permission] === true;
    });
  }, [stagePermissions, isAdmin]);

  // =========================================================
  // FETCH REQUEST BERDASARKAN STAGE
  // =========================================================

  useEffect(() => {
    const fetchRequests = async () => {
      setLoading(true);

      try {
        const token = localStorage.getItem("token");

        if (!token) {
          throw new Error("Token login tidak ditemukan.");
        }

        const stageList = ["REQUESTER", "ACCOUNTING", "TAX", "SAP"];

        const responses = await Promise.all(
          stageList.map(async (stage) => {
            const response = await fetch(
              `http://localhost:8000/api/vendor-requests/stage/${stage}`,
              {
                headers: {
                  Authorization: `Bearer ${token}`,
                  Accept: "application/json",
                },
              },
            );

            const result = await response.json().catch(() => ({}));

            if (!response.ok) {
              if (response.status === 403) {
                return {
                  stage,
                  data: [],
                  permissions: null,
                };
              }

              throw new Error(
                result.message || `Gagal mengambil data ${stage}.`,
              );
            }

            return {
              stage,
              data: Array.isArray(result.data) ? result.data : [],
              permissions: result.permissions || null,
            };
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
            (!request.vendor?.source_type ||
              request.vendor.source_type === "NEW"),
        );

        setRequests(activeRequests);

        console.log("Approval Requests:", activeRequests);
        console.log("Stage Permissions:", permissionMap);
      } catch (error) {
        console.error("Error mengambil data approval:", error);
        setRequests([]);
      } finally {
        setLoading(false);
      }
    };

    fetchRequests();
  }, []);

  // =========================================================
  // FETCH HISTORY APPROVED
  // =========================================================

  useEffect(() => {
    if (activeTab !== "HISTORY") return;

    let cancelled = false;

    const fetchHistory = async () => {
      setHistoryLoading(true);

      try {
        const token = localStorage.getItem("token");

        const response = await fetch(
          "http://localhost:8000/api/vendor-requests/completed",
          {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: "application/json",
            },
          },
        );

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || "Gagal mengambil History Approved.");
        }

        if (cancelled) return;

        const completedRequests = (Array.isArray(data) ? data : []).filter(
          (request) =>
            request.current_stage === "COMPLETED" &&
            request.status === "Approved" &&
            (!request.vendor?.source_type ||
              request.vendor.source_type === "NEW"),
        );

        setHistoryRequests(completedRequests);
      } catch (error) {
        console.error("Error mengambil history:", error);

        if (!cancelled) {
          setHistoryRequests([]);
        }
      } finally {
        if (!cancelled) {
          setHistoryLoading(false);
        }
      }
    };

    fetchHistory();

    return () => {
      cancelled = true;
    };
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

      counts[card.value] = requests.filter(
        (request) =>
          request.current_stage === card.stage &&
          card.statuses.includes(request.status),
      ).length;
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
        if (request.current_stage !== selectedCard.stage) {
          return false;
        }

        if (!selectedCard.statuses.includes(request.status)) {
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
        return "approval-status pending";

      case "Under Review":
        return "approval-status review";

      case "Approved":
        return "approval-status approved";

      case "Rejected":
        return "approval-status rejected";

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
        `http://localhost:8000/api/vendor-requests/${requestId}/pdf`,
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/pdf",
          },
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
            <h2>Approval</h2>
            <p>
              Kelola dan proses pengajuan vendor baru berdasarkan tahapan
              workflow.
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
          }}
        >
          History Approved
          <span>{historyRequests.length}</span>
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
                className={`approval-workflow-card ${
                  card.value === "ALL"
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
                              {request.status || "-"}
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
                                  Proses <span>→</span>
                                </button>
                              )}

                            {request.status === "Rejected" && (
                              <button
                                type="button"
                                className="approval-process-button"
                                onClick={() => handleDetail(request)}
                              >
                                Detail <span>→</span>
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
                    <th>Status</th>
                    <th width="120">PDF</th>
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
                            <span className="approval-status approved">
                              Approved
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
    </div>
  );
}

export default Approval;
