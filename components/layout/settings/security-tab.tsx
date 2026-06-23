"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { Label } from "@/components/ui/label";
import { QRCode, QRCodeCanvas } from "@/components/ui/qr-code";
import { useCurrentUser } from "@/features/auth/hooks/use-auth";
import { authClient } from "@/lib/auth-client";
import { axiosInstance } from "@/lib/axios";
import { cn } from "@/lib/utils";
import {
  Delete02Icon,
  FingerPrintIcon,
  SecurityPasswordIcon,
  Shield01Icon,
  SmartPhone01Icon,
  ComputerIcon,
  TabletIcon,
  LaptopIcon
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export function SecurityTab() {
  const queryClient = useQueryClient();
  const { data: auth } = useCurrentUser();
  const [sessions, setSessions] = useState<LooseAny[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);
  const [showTwoFactorDialog, setShowTwoFactorDialog] = useState(false);
  const [twoFactorStep, setTwoFactorStep] = useState<"password" | "otp" | "qr" | "verify" | "disable">("password");
  const [twoFactorPassword, setTwoFactorPassword] = useState("");
  const [twoFactorOtp, setTwoFactorOtp] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [totpUri, setTotpUri] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [showBackupCodes, setShowBackupCodes] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwords, setPasswords] = useState({ current: "", new: "", confirm: "" });
  const [resendTimer, setResendTimer] = useState(0);

  const isTwoFactorEnabled = !!auth?.user?.twoFactorEnabled;

  const refreshSession = async () => {
    await queryClient.invalidateQueries({ queryKey: ["auth"] });
  };

  const fetchSessions = useCallback(async () => {
    setLoadingSessions(true);
    try {
      const { data } = await authClient.listSessions();
      if (data) setSessions(data);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  const handleSendOtp = useCallback(async () => {
    if (resendTimer > 0) return;
    setSendingOtp(true);
    try {
      await axiosInstance.post("auth/two-factor/send-otp");
      toast.success("Verification code sent to your email");
      setResendTimer(60);
    } catch {
      toast.error("Failed to send verification code");
    } finally {
      setSendingOtp(false);
    }
  }, [resendTimer]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- Fetching initial data
    fetchSessions();
  }, [fetchSessions]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (resendTimer > 0) {
      interval = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendTimer]);

  useEffect(() => {
    if (showTwoFactorDialog && twoFactorStep === "otp") {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- Auto-send OTP when step is reached
      handleSendOtp();
    }
  }, [showTwoFactorDialog, twoFactorStep, handleSendOtp]);

  const handleRevokeSession = async (token: string) => {
    try {
      const { error } = await authClient.revokeSession({ token });
      if (error) {
        toast.error(error.message || "Failed to revoke session");
        return;
      }
      toast.success("Session revoked");
      fetchSessions();
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleRevokeAllSessions = async () => {
    try {
      const { error } = await authClient.revokeOtherSessions();
      if (error) {
        toast.error(error.message || "Failed to revoke sessions");
        return;
      }
      toast.success("All other sessions revoked");
      fetchSessions();
    } catch {
      toast.error("An error occurred");
    }
  };

  const downloadBackupCodes = () => {
    if (!backupCodes || backupCodes.length === 0) {
      toast.error("No backup codes available to download");
      return;
    }
    const text = `Veylo Recovery Codes\nGenerated on: ${new Date().toLocaleString()}\n\n${backupCodes.join("\n")}\n\nKeep these codes safe!`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "veylo-recovery-codes.txt";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const initiateTwoFactor = () => {
    if (auth?.user?.hasPassword) {
      setTwoFactorStep("password");
    } else {
      setTwoFactorStep("otp");
    }
    setTwoFactorPassword("");
    setTwoFactorOtp("");
    setShowTwoFactorDialog(true);
  };

  const handleEnableTwoFactorSocial = async () => {
    try {
      const response = await axiosInstance.post("auth/two-factor/enable-social", {
        otp: twoFactorOtp
      });
      const { data } = response.data;
      if (data) {
        setTotpUri(data.totpURI);
        if (data.backupCodes) {
          setBackupCodes(data.backupCodes);
        }
        setTwoFactorStep("qr");
      }
    } catch (err) {
      toast.error((err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Verification failed");
    }
  };

  const handleEnableTwoFactor = async () => {
    try {
      const { data, error } = await authClient.twoFactor.enable({
        password: twoFactorPassword
      });
      if (error) {
         toast.error(error.message || "Failed to initiate 2FA");
         return;
      }
      if (data) {
        setTotpUri(data.totpURI);
        if ((data as { backupCodes?: string[] }).backupCodes) {
          setBackupCodes((data as { backupCodes?: string[] }).backupCodes || []);
        }
        setTwoFactorStep("qr");
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleVerifyTwoFactor = async () => {
    try {
      const { data, error } = await authClient.twoFactor.verifyTotp({
        code: otpCode
      });
      if (error) {
        toast.error(error.message || "Invalid code");
        return;
      }
      if (data) {
        const incomingCodes = (data as { backupCodes?: string[] }).backupCodes;
        if (incomingCodes && incomingCodes.length > 0) {
          setBackupCodes(incomingCodes);
        }
        setShowTwoFactorDialog(false);
        setShowBackupCodes(true);
        toast.success("Two-factor authentication enabled");
        refreshSession();
      }
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleDisableTwoFactor = async () => {
    setTwoFactorStep("disable");
    setOtpCode("");
    setTwoFactorPassword("");
    setShowTwoFactorDialog(true);
  };

  const confirmDisableTwoFactor = async () => {
    try {
      const { error } = await authClient.twoFactor.disable({
        password: twoFactorPassword,
      });
      if (error) {
        toast.error(error.message || "Failed to disable 2FA");
        return;
      }
      setShowTwoFactorDialog(false);
      toast.success("Two-factor authentication disabled");
      refreshSession();
    } catch {
      toast.error("An error occurred");
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error("Passwords do not match");
      return;
    }
    setChangingPassword(true);
    try {
      const { error } = await authClient.changePassword({
        currentPassword: passwords.current,
        newPassword: passwords.new,
        revokeOtherSessions: true,
      });
      if (error) {
        toast.error(error.message || "Failed to change password");
        return;
      }
      toast.success("Password changed successfully");
      setPasswords({ current: "", new: "", confirm: "" });
    } catch {
      toast.error("An error occurred");
    } finally {
      setChangingPassword(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-300 pb-20">
      <div>
        <h3 className="text-lg font-medium">Sessions & Security</h3>
        <p className="text-sm text-muted-foreground">
          Secure your account with two-factor authentication and manage active sessions.
        </p>
      </div>

      <div className="grid gap-6">
        {/* 2FA Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={Shield01Icon} size={18} />
                  Two-Factor Authentication
                </CardTitle>
                <CardDescription>
                  Add an extra layer of security to your account.
                </CardDescription>
              </div>
              <Badge variant={isTwoFactorEnabled ? "default" : "secondary"}>
                {isTwoFactorEnabled ? "Enabled" : "Disabled"}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 border">
              <div className="p-2 rounded-full bg-primary/10 text-primary">
                 <HugeiconsIcon icon={SmartPhone01Icon} size={20} />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium">Authenticator App</p>
                <p className="text-xs text-muted-foreground">
                  Use an app like Google Authenticator or 1Password to generate one-time codes.
                </p>
              </div>
              <Button 
                variant={isTwoFactorEnabled ? "outline" : "default"} 
                size="sm" 
                className="ml-auto"
                onClick={isTwoFactorEnabled ? handleDisableTwoFactor : initiateTwoFactor}
              >
                {isTwoFactorEnabled ? "Disable" : "Enable"}
              </Button>
            </div>

            {isTwoFactorEnabled && (
              <Button variant="link" className="p-0 h-auto text-xs" onClick={() => setShowBackupCodes(true)}>
                View Recovery Keys
              </Button>
            )}
          </CardContent>
        </Card>

        {/* Change Password Card */}
        {auth?.user?.hasPassword && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <HugeiconsIcon icon={SecurityPasswordIcon} size={18} />
                Change Password
              </CardTitle>
              <CardDescription>
                Update your password regularly to keep your account safe.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
                <div className="space-y-2">
                  <Label htmlFor="current-password">Current Password</Label>
                  <Input
                    id="current-password"
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="new-password">New Password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password">Confirm New Password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                  />
                </div>
                <Button type="submit" disabled={changingPassword}>
                  {changingPassword ? "Updating..." : "Update Password"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Sessions Card */}
        <Card className="mb-4">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2">
                  <HugeiconsIcon icon={FingerPrintIcon} size={18} />
                  Active Sessions
                </CardTitle>
                <CardDescription>
                  Manage the devices and browsers currently logged into your account.
                </CardDescription>
              </div>
              <Button variant="ghost" size="sm" className="text-destructive" onClick={handleRevokeAllSessions}>
                 Revoke All
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {loadingSessions ? (
               <div className="py-4 text-center text-sm text-muted-foreground">Loading sessions...</div>
            ) : sessions.length === 0 ? (
               <div className="py-4 text-center text-sm text-muted-foreground">No active sessions.</div>
            ) : (
              <div className="space-y-4">
                {[...sessions]
                  .sort((a, b) => {
                    if (a.id === auth?.session?.id) return -1;
                    if (b.id === auth?.session?.id) return 1;
                    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
                  })
                  .map((session) => {
                    const isCurrent = session.id === auth?.session?.id;
                    const os = session.os?.toLowerCase() || "";
                    const userAgent = session.userAgent?.toLowerCase() || "";
                    
                    const isMobile = os.includes("android") || os.includes("ios") || os.includes("iphone") || userAgent.includes("mobile");
                    const isTablet = os.includes("ipad") || os.includes("tablet");
                    const isMac = os.includes("mac") || userAgent.includes("macintosh");
                    
                    const DeviceIcon = isMobile ? SmartPhone01Icon : isTablet ? TabletIcon : isMac ? LaptopIcon : ComputerIcon;

                    return (
                      <div key={session.id} className="flex items-start justify-between p-4 rounded-xl border bg-muted/20 hover:bg-muted/30 transition-colors">
                        <div className="flex items-start gap-4">
                          <div className="p-2.5 rounded-lg bg-background border shadow-sm mt-0.5">
                            <HugeiconsIcon icon={DeviceIcon} size={20} className="text-foreground/80" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex flex-col">
                              <p className="text-sm font-semibold text-foreground">
                                {session.deviceName || (isMac ? "MacBook Pro" : isMobile ? "Smartphone" : "Desktop Computer")}
                              </p>
                              {isCurrent && (
                                <span className="text-[10px] font-medium text-primary uppercase tracking-wider">
                                  This device
                                </span>
                              )}
                            </div>
                            
                            <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                              {[
                                session.browser,
                                session.os,
                                session.location || session.country,
                                session.ipAddress
                              ].filter(Boolean).join(" · ")}
                            </p>
                            
                            <div className="flex items-center gap-1.5 mt-2">
                               <div className={cn("size-1.5 rounded-full", isCurrent ? "bg-green-500 animate-pulse" : "bg-muted-foreground/40")} />
                               <p className="text-[11px] font-medium text-muted-foreground">
                                 {isCurrent ? "Active now" : `Last active: ${new Date(session.updatedAt).toLocaleString()}`}
                               </p>
                            </div>
                          </div>
                        </div>
                        {!isCurrent && (
                          <Button variant="ghost" size="icon-sm" className="text-muted-foreground hover:text-destructive transition-colors -mr-1" onClick={() => handleRevokeSession(session.token)}>
                            <HugeiconsIcon icon={Delete02Icon} size={16} />
                          </Button>
                        )}
                      </div>
                    );
                  })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* 2FA Setup/Disable Dialog */}
      <Dialog open={showTwoFactorDialog} onOpenChange={setShowTwoFactorDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {twoFactorStep === "disable" ? "Disable two-factor authentication" : "Set up two-factor authentication"}
            </DialogTitle>
            <DialogDescription>
              {twoFactorStep === "password" 
                ? "Please confirm your password to enable two-factor authentication." 
                : twoFactorStep === "disable"
                ? auth?.user?.hasPassword 
                  ? "Please confirm your password to disable two-factor authentication."
                  : "Are you sure you want to disable two-factor authentication? This will make your account less secure."
                : "Scan the QR code below with your authenticator app."}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-col items-center gap-6 py-4">
            {twoFactorStep === "password" ? (
              <div className="space-y-4 w-full">
                <div className="space-y-2">
                  <Label>Confirm Password</Label>
                  <Input 
                    type="password" 
                    placeholder="Enter your current password" 
                    value={twoFactorPassword}
                    onChange={(e) => setTwoFactorPassword(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground">
                    For your security, please confirm your password to continue.
                  </p>
                </div>
                <Button 
                  className="w-full" 
                  onClick={handleEnableTwoFactor} 
                  disabled={!twoFactorPassword}
                >
                  Continue
                </Button>
              </div>
            ) : twoFactorStep === "disable" ? (
              <div className="space-y-6 w-full flex flex-col items-center">
                {auth?.user?.hasPassword && (
                  <div className="space-y-2 w-full">
                    <Label>Confirm Password</Label>
                    <Input 
                      type="password" 
                      placeholder="Enter your current password" 
                      value={twoFactorPassword}
                      onChange={(e) => setTwoFactorPassword(e.target.value)}
                    />
                  </div>
                )}
                
                <div className="space-y-2 w-full flex flex-col items-center">
                  <Label>Enter the 6-digit code from your app</Label>
                  <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>
                  <p className="text-xs text-muted-foreground text-center mt-2">
                    Enter the code from your authenticator app to disable 2FA.
                  </p>
                </div>

                <Button 
                  className="w-full" 
                  onClick={confirmDisableTwoFactor} 
                  variant="destructive"
                  disabled={otpCode.length !== 6 || (auth?.user?.hasPassword && !twoFactorPassword)}
                >
                  Disable 2FA
                </Button>
              </div>
            ) : twoFactorStep === "otp" ? (
              <div className="space-y-6 w-full flex flex-col items-center">
                <div className="space-y-2 w-full text-center">
                  <Label>Verify your email</Label>
                  <p className="text-xs text-muted-foreground">
                    We&apos;ll send a verification code to <strong>{auth?.user?.email}</strong>.
                  </p>
                </div>
                
                <div className="flex flex-col gap-6 w-full items-center">
                  <InputOTP maxLength={6} value={twoFactorOtp} onChange={setTwoFactorOtp}>
                    <InputOTPGroup>
                      <InputOTPSlot index={0} />
                      <InputOTPSlot index={1} />
                      <InputOTPSlot index={2} />
                      <InputOTPSlot index={3} />
                      <InputOTPSlot index={4} />
                      <InputOTPSlot index={5} />
                    </InputOTPGroup>
                  </InputOTP>

                  <div className="text-center">
                    <p className="text-sm text-muted-foreground">
                      Haven&apos;t received code yet?{" "}
                      {resendTimer > 0 ? (
                        <span className="font-medium text-primary">Resend in {resendTimer}s</span>
                      ) : (
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={sendingOtp}
                          className="font-medium text-primary hover:underline disabled:opacity-50"
                        >
                          {sendingOtp ? "Sending..." : "Resend"}
                        </button>
                      )}
                    </p>
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  onClick={handleEnableTwoFactorSocial} 
                  disabled={twoFactorOtp.length !== 6}
                >
                  Verify & Continue
                </Button>
              </div>
            ) : twoFactorStep === "qr" ? (
              <>
                <div className="p-4 bg-white rounded-lg border">
                  <QRCode value={totpUri} size={192}>
                    <QRCodeCanvas />
                  </QRCode>
                </div>
                <div className="w-full space-y-2">
                  <Label>Manual Entry Key</Label>
                  <Input readOnly value={totpUri.split('secret=')[1]?.split('&')[0] || ""} className="font-mono text-xs" />
                </div>
                <Button className="w-full" onClick={() => setTwoFactorStep("verify")}>
                  I&apos;ve scanned the code
                </Button>
              </>
            ) : (
              <div className="space-y-6 w-full flex flex-col items-center">
                <Label>Enter the 6-digit code from your app</Label>
                <InputOTP maxLength={6} value={otpCode} onChange={setOtpCode}>
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
                <div className="flex gap-2 w-full">
                   <Button variant="outline" className="flex-1" onClick={() => setTwoFactorStep("qr")}>Back</Button>
                   <Button className="flex-1" onClick={handleVerifyTwoFactor} disabled={otpCode.length !== 6}>Verify</Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Backup Codes Dialog */}
      <Dialog open={showBackupCodes} onOpenChange={setShowBackupCodes}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Recovery Keys</DialogTitle>
            <DialogDescription>
              Store these recovery keys in a safe place. They can be used to access your account if you lose your authenticator device.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-2 py-4">
            {backupCodes?.map((code, i) => (
              <div key={i} className="p-2 bg-muted rounded font-mono text-center text-sm">{code}</div>
            ))}
            {/* Fallback if codes aren't currently in state (viewing existing) */}
            {(backupCodes?.length === 0 || !backupCodes) && (
               <div className="col-span-2 py-4 text-center text-sm text-muted-foreground italic">
                 Recovery keys are only shown once during setup or when regenerated.
               </div>
            )}
          </div>

          <DialogFooter className="flex-col sm:flex-col gap-2">
             <Button variant="outline" className="w-full" onClick={downloadBackupCodes}>
                <HugeiconsIcon icon={Shield01Icon} size={16} className="mr-2" />
                Download as .txt
             </Button>
             <Button className="w-full" onClick={() => setShowBackupCodes(false)}>I&apos;ve saved these keys</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
