import { useEffect, useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';

function VendorRequest() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchRequests = async () => {
    try {
      const response = await fetch(
        'http://localhost:8000/api/vendor-requests',
        {
          headers: {
            'Authorization':
              'Bearer ' + localStorage.getItem('token'),
            'Accept': 'application/json',
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        console.error('Gagal mengambil request:', data);
        return;
      }

      setRequests(data);
    } catch (error) {
      console.error(
        'Error mengambil vendor request:',
        error
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
  }, []);

  if (loading) {
    return (
      <div className="container mt-4">
        <p>Loading...</p>
      </div>
    );
  }

  return (
    <div className="container-fluid mt-4">

      <h3 className="mb-4">
        Vendor Request
      </h3>

      <div className="card">

        <div className="card-body">

          <div className="table-responsive">

            <table className="table table-bordered table-hover">

              <thead>
                <tr>
                  <th>No</th>
                  <th>Vendor</th>
                  <th>Request</th>
                  <th>Status</th>
                  <th>Stage</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>

                {requests.length === 0 ? (

                  <tr>
                    <td
                      colSpan="6"
                      className="text-center"
                    >
                      Belum ada vendor request
                    </td>
                  </tr>

                ) : (

                  requests.map((item, index) => (

                    <tr key={item.id}>

                      <td>
                        {index + 1}
                      </td>

                      <td>
                        {item.vendor?.nama_perusahaan || '-'}
                      </td>

                      <td>
                        {item.request_type}
                      </td>

                      <td>
                        {item.status}
                      </td>

                      <td>
                        {item.current_stage}
                      </td>

                      <td>
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() =>
                            window.location.href =
                              `/vendor-requests/${item.id}`
                          }
                        >
                          Buka
                        </button>
                      </td>

                    </tr>

                  ))

                )}

              </tbody>

            </table>

          </div>

        </div>

      </div>

    </div>
  );
}

export default VendorRequest;