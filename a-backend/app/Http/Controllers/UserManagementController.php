<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;

class UserManagementController extends Controller
{
    /**
     * Mengambil seluruh data user beserta role.
     */
    public function index()
    {
        $users = User::with('role')->orderBy('name')->get();

        return response()->json([
            'data' => $users,
        ]);
    }

    /**
     * Mengambil detail user.
     */
    public function show($id)
    {
        $user = User::with('role')->findOrFail($id);

        return response()->json([
            'data' => $user,
        ]);
    }

    /**
     * Update role user.
     */
    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id',
        ]);

        $user = User::findOrFail($id);
        $user->role_id = $request->role_id;
        $user->save();

        return response()->json([
            'message' => 'Role user berhasil diperbarui',
            'user' => $user->load('role'),
        ]);
    }

    /**
     * Update lengkap user (Role, Status Active/Inactive, dan Pengganti Cuti / substitute_nik).
     */
    public function update(Request $request, $id)
    {
        $validated = $request->validate([
            'role_id' => 'nullable|exists:roles,id',
            'is_active' => 'nullable|boolean',
            'substitute_nik' => 'nullable|string|max:50',
            'division' => 'nullable|string|max:100',
            'department' => 'nullable|string|max:100',
            'position' => 'nullable|string|max:100',
        ]);

        $user = User::findOrFail($id);

        if (array_key_exists('role_id', $validated)) {
            $user->role_id = $validated['role_id'];
        }
        if (array_key_exists('is_active', $validated)) {
            $user->is_active = (bool) $validated['is_active'];
        }
        if (array_key_exists('substitute_nik', $validated)) {
            $user->substitute_nik = $validated['substitute_nik'];
        }
        if (array_key_exists('division', $validated)) {
            $user->division = $validated['division'];
        }
        if (array_key_exists('department', $validated)) {
            $user->department = $validated['department'];
        }
        if (array_key_exists('position', $validated)) {
            $user->position = $validated['position'];
        }

        $user->save();

        return response()->json([
            'message' => 'Data user berhasil diperbarui',
            'user' => $user->load('role'),
        ]);
    }
}
