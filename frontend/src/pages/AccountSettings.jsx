import { useState } from "react";
import Navbar from "../components/Navbar";

function AccountSettings()
{
    //CHANGE PASSWORD
    const [currentPass, setCurrentPass] = useState("");
    const [newPass, setNewPass] = useState("");
    const [confirmPass, setConfirmPass] = useState("");
    const [passError, setPassError] = useState("");
    const [passSuccess, setPassSuccess] = useState(false);

    //DELETE ACCOUNT
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    const handlePassSubmit = (e) => 
    {
        e.preventDefault();
        setPassError("");
        setPassSuccess(false);

        if (!currentPass || !newPass || !confirmPass)
        {
            setPassError("All fields are required.");
            return;
        }
        if (newPass !== confirmPass)
        {
            setPassError("New password and confirmation do not match.");
            return;
        }
        if (newPass.length < 8) 
        {
            setPassError("New password must be at least 8 characters.");
            return;
        }

        //REAL PASSWORD-UPDATE 
        setPassSuccess(true);
        setCurrentPass("");
        setNewPass("");
        setConfirmPass("");
    };

    const handleDeleteAccount = () => 
    {
        //REAL DELETE ACOOUNT REQUEST
        alert("Account deletion would be processed here.");
    };

    return (
        <div className="site">
        <Navbar />

        <main className="settings-page">
            <div className="container">
            <h1 className="settings-title">Account Settings</h1>
            <p className="settings-subtitle">
                Change your password or delete your account.
            </p>

            {/* CHANGE PASSWORD */}
            <div className="settings-card">
                <h2 className="settings-card-heading">Change Password</h2>

                <form className="settings-form" onSubmit={handlePassSubmit}>
                <div className="form-field">
                    <label className="form-label">Current Password</label>
                    <input
                    type="password"
                    value={currentPass}
                    onChange={(e) => setCurrentPass(e.target.value)}
                    placeholder="Enter current password"
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">New Password</label>
                    <input
                    type="password"
                    value={newPass}
                    onChange={(e) => setNewPass(e.target.value)}
                    placeholder="Enter new password"
                    />
                </div>

                <div className="form-field">
                    <label className="form-label">Confirm New Password</label>
                    <input
                    type="password"
                    value={confirmPass}
                    onChange={(e) => setConfirmPass(e.target.value)}
                    placeholder="Re-enter new password"
                    />
                </div>

                {passError && (
                    <div className="form-error">
                    <span className="field-error">{passError}</span>
                    </div>
                )}

                {passSuccess && (
                    <div className="settings-success">
                    Password updated successfully.
                    </div>
                )}

                <button type="submit" className="btn btn-primary settings-submit">
                    Update Password
                </button>
                </form>
            </div>

            {/* DELETE ACCOUNT */}
            <div className="settings-card settings-danger">
                <h2 className="settings-card-heading">Delete Account</h2>
                <p className="settings-danger-text">
                This will permanently delete your account and all associated data.
                This action cannot be undone.
                </p>

                {!showDeleteConfirm ? (
                <button
                    className="btn btn-ghost-dark settings-delete-btn"
                    onClick={() => setShowDeleteConfirm(true)}
                >
                    Delete My Account
                </button>
                ) : (
                <div className="settings-confirm">
                    <p>Are you sure? This cannot be undone.</p>
                    <div className="settings-confirm-actions">
                    <button
                        className="btn btn-ghost-dark"
                        onClick={() => setShowDeleteConfirm(false)}
                    >
                        Cancel
                    </button>
                    <button
                        className="btn settings-delete-confirm-btn"
                        onClick={handleDeleteAccount}
                    >
                        Yes, Delete My Account
                    </button>
                    </div>
                </div>
                )}
            </div>
             <p style={{ textAlign: "center", fontSize: "11px", color: "#9aa4b8", marginTop: "24px"}}>
               VT Marumo 
               </p>
            </div>
        </main>
        </div>
    );
    }

    export default AccountSettings;
    