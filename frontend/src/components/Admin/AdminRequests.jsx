import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye,
  Calendar,
  Mail,
  User
} from 'lucide-react';
import toast from 'react-hot-toast';

const AdminRequests = () => {
  const [requests, setRequests] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);

  useEffect(() => {
    fetchAdminRequests();
  }, []);

  const fetchAdminRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/auth/admin-requests', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setRequests(data.data);
      } else {
        throw new Error('Failed to fetch admin requests');
      }
    } catch (error) {
      console.error('Error fetching admin requests:', error);
      toast.error('Failed to load admin requests');
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = async (requestId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/admin-requests/${requestId}/approve`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast.success('Admin request approved successfully!');
        fetchAdminRequests(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to approve request');
      }
    } catch (error) {
      console.error('Error approving request:', error);
      toast.error(error.message || 'Failed to approve request');
    }
  };

  const handleReject = async () => {
    if (!selectedRequest) return;

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/auth/admin-requests/${selectedRequest._id}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          reason: rejectionReason
        })
      });

      if (response.ok) {
        toast.success('Admin request rejected');
        setShowRejectModal(false);
        setRejectionReason('');
        setSelectedRequest(null);
        fetchAdminRequests(); // Refresh the list
      } else {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to reject request');
      }
    } catch (error) {
      console.error('Error rejecting request:', error);
      toast.error(error.message || 'Failed to reject request');
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            Admin Requests
          </h2>
          <p className="text-gray-600 dark:text-gray-400">
            Manage admin access requests from users
          </p>
        </div>
        <div className="flex items-center space-x-2 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-lg">
          <Users className="w-5 h-5 text-blue-600" />
          <span className="text-blue-600 dark:text-blue-400 font-medium">
            {requests.filter(r => r.status === 'pending').length} Pending
          </span>
        </div>
      </div>

      {/* Requests List */}
      {requests.length === 0 ? (
        <div className="text-center py-12">
          <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No Admin Requests
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            No admin access requests have been submitted yet.
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {requests.map((request) => (
            <motion.div
              key={request._id}
              layout
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-white" />
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {request.user.firstName} {request.user.lastName}
                    </h3>
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <Mail className="w-4 h-4" />
                        <span>{request.user.email}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Calendar className="w-4 h-4" />
                        <span>Requested {formatDate(request.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-3">
                  <div className={`px-3 py-1 rounded-full text-xs font-medium flex items-center space-x-1 ${getStatusColor(request.status)}`}>
                    {getStatusIcon(request.status)}
                    <span className="capitalize">{request.status}</span>
                  </div>

                  {request.status === 'pending' && (
                    <div className="flex items-center space-x-2">
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleApprove(request._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        <CheckCircle className="w-4 h-4" />
                        <span>Approve</span>
                      </motion.button>
                      
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => {
                          setSelectedRequest(request);
                          setShowRejectModal(true);
                        }}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 flex items-center space-x-1"
                      >
                        <XCircle className="w-4 h-4" />
                        <span>Reject</span>
                      </motion.button>
                    </div>
                  )}

                  {request.status !== 'pending' && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {request.reviewedBy && (
                        <div>
                          Reviewed by {request.reviewedBy.firstName} {request.reviewedBy.lastName}
                          <br />
                          {formatDate(request.reviewedAt)}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {request.rejectionReason && (
                <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">
                    <strong>Rejection Reason:</strong> {request.rejectionReason}
                  </p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full p-6"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Reject Admin Request
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Are you sure you want to reject the admin request from{' '}
              <strong>
                {selectedRequest?.user.firstName} {selectedRequest?.user.lastName}
              </strong>?
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Reason for rejection (optional)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Provide a reason for rejection..."
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white resize-none h-20"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setShowRejectModal(false);
                  setRejectionReason('');
                  setSelectedRequest(null);
                }}
                className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors duration-200"
              >
                Cancel
              </motion.button>
              
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleReject}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors duration-200"
              >
                Reject Request
              </motion.button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminRequests;
