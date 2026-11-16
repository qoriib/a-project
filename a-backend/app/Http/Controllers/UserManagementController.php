<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use MessageFormatter;
use Nette\Schema\Message;

class UserManagementController extends Controller
{

    // mengambil semua user
    public function index()
    {
        $users = User::with('role')->get();

        return response()->json([
            'data' => $users
        ]);
    }

    // mengambil detail user
    public function show($id)
    {

        $user = User::with('role')
            ->findOrFail($id);


        return response()->json([
            'data' => $user
        ]);
    }



    // update role user
    public function updateRole(Request $request, $id)
    {
        $request->validate([
            'role_id' => 'required|exists:roles,id'
        ]);


        $user = User::findOrFail($id);

        $user->role_id = $request->role_id;

        $user->save();


        return response()->json([
            'message' => 'Role user berhasil diperbarui',
            'user' => $user->load('role')
        ]);
    }
}
