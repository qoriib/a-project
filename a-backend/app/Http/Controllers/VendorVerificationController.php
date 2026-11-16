<?php

namespace App\Http\Controllers;

use App\Models\VendorApprovalHistory;
use Illuminate\Http\JsonResponse;

class VendorVerificationController extends Controller
{
    /**
     * Memverifikasi QR Code berdasarkan signature_token.
     */
    public function show(string $token): JsonResponse
    {
        $approval = VendorApprovalHistory::with('actor')
            ->where('signature_token', $token)
            ->first();

        // Token tidak ditemukan atau tidak cocok.
        if (!$approval) {
            return response()->json([
                'valid' => false,
                'message' => 'QR Code tidak valid atau riwayat approval tidak ditemukan.',
            ], 404);
        }

        // Ambil request beserta data vendor terkait.
        $vendorRequest = $approval->vendorRequest()
            ->with('vendor')
            ->first();

        if (!$vendorRequest || !$vendorRequest->vendor) {
            return response()->json([
                'valid' => false,
                'message' => 'Data vendor tidak ditemukan.',
            ], 404);
        }

        $vendor = $vendorRequest->vendor;

        $approvalStatus = strtoupper(
            (string) $approval->status
        );

        $requestStatus = strtoupper(
            (string) $vendorRequest->status
        );

        $currentStage = strtoupper(
            (string) $vendorRequest->current_stage
        );

        // Status token valid berbeda dengan status approval.
        // Token bisa valid meskipun tahapnya ditolak.
        $isApproved = $approvalStatus === 'APPROVED';

        $isCompleted =
            $requestStatus === 'APPROVED'
            && $currentStage === 'COMPLETED'
            && !empty($vendor->vendor_code);

        return response()->json([
            'valid' => true,
            'message' => 'Token QR cocok dengan riwayat approval di sistem.',

            'approval' => [
                'stage' => strtoupper(
                    (string) $approval->approval_stage
                ),
                'status' => $approval->status,
                'is_approved' => $isApproved,
                'approver' => $approval->actor->name ?? null,
                'acted_at' => $approval->acted_at,
            ],

            'vendor' => [
                'name' => $vendor->nama_perusahaan,
                'vendor_code' => $vendor->vendor_code,
            ],

            'request' => [
                'id' => $vendorRequest->id,
                'status' => $vendorRequest->status,
                'current_stage' => $vendorRequest->current_stage,
                'is_completed' => $isCompleted,
            ],
        ]);
    }
}
