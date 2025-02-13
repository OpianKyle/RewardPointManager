import { useState } from "react";
import { useUser } from "@/hooks/use-user";
import { useLocation } from "wouter";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import SignatureCanvas from "react-signature-canvas";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

export default function HomePage() {
  // Login state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  // Extended registration state
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regFirstName, setRegFirstName] = useState("");
  const [regLastName, setRegLastName] = useState("");
  const [regPhone, setRegPhone] = useState("");
  const [isSACitizen, setIsSACitizen] = useState(false);
  const [idNumber, setIdNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState<Date>();
  const [gender, setGender] = useState("");
  const [language, setLanguage] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [bankName, setBankName] = useState("");
  const [branchCode, setBranchCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [signatureRef, setSignatureRef] = useState<SignatureCanvas | null>(null);
  const [mandateAccepted, setMandateAccepted] = useState(false);
  const [regError, setRegError] = useState("");

  const { loginMutation, registerMutation, user, isLoading } = useUser();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Check loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect if already logged in
  if (user) {
    navigate(user.isAdmin ? '/admin' : '/dashboard');
    return null;
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");

    if (!loginEmail || !loginPassword) {
      setLoginError("Please fill in all fields");
      return;
    }

    try {
      const user = await loginMutation.mutateAsync({
        email: loginEmail,
        password: loginPassword
      });

      toast({
        title: "Success",
        description: "Login successful",
      });

      navigate(user.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setLoginError("Invalid email or password");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Invalid email or password",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setRegError("");

    // Basic validation
    if (!regEmail || !regPassword || !regFirstName || !regLastName || !regPhone ||
        !idNumber || !dateOfBirth || !gender || !language || !accountHolder ||
        !bankName || !branchCode || !accountNumber || !accountType || !mandateAccepted) {
      setRegError("Please fill in all required fields");
      return;
    }

    if (!signatureRef?.toDataURL()) {
      setRegError("Please provide your digital signature");
      return;
    }

    try {
      const user = await registerMutation.mutateAsync({
        email: regEmail,
        password: regPassword,
        firstName: regFirstName,
        lastName: regLastName,
        phoneNumber: regPhone,
        isSouthAfricanCitizen: isSACitizen,
        idNumber,
        dateOfBirth: dateOfBirth.toISOString(),
        gender,
        language,
        accountHolderName: accountHolder,
        bankName,
        branchCode,
        accountNumber,
        accountType,
        digitalSignature: signatureRef.toDataURL(),
        mandateAccepted,
      });

      toast({
        title: "Success",
        description: "Registration successful",
      });

      navigate(user.isAdmin ? '/admin' : '/dashboard');
    } catch (err) {
      setRegError("Registration failed. Please try again.");
      toast({
        variant: "destructive",
        title: "Error",
        description: "Registration failed. Please try again.",
      });
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="flex flex-col items-center">
          <img
            src="/Assets/opian-rewards-logo (R).png"
            alt="Logo"
            className="h-12 w-auto"
            onError={(e) => {
              const img = e.target as HTMLImageElement;
              img.onerror = null;
              img.src = '/logo-fallback.png';
            }}
          />
          <h2 className="mt-6 text-2xl font-semibold">Welcome to OPIAN Rewards</h2>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Register</TabsTrigger>
          </TabsList>

          {/* Login Form */}
          <TabsContent value="login">
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-4">
                <Input
                  id="login-email"
                  type="email"
                  placeholder="Email address"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="w-full"
                />
                <Input
                  id="login-password"
                  type="password"
                  placeholder="Password"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="w-full"
                />
              </div>

              {loginError && (
                <div className="text-sm text-red-500 text-center">
                  {loginError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={loginMutation.isPending}
              >
                {loginMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Signing in...
                  </div>
                ) : (
                  "Sign in"
                )}
              </Button>
            </form>
          </TabsContent>

          {/* Registration Form */}
          <TabsContent value="register">
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-4">
                {/* Personal Information */}
                <div className="grid grid-cols-2 gap-4">
                  <Input
                    placeholder="First Name"
                    value={regFirstName}
                    onChange={(e) => setRegFirstName(e.target.value)}
                  />
                  <Input
                    placeholder="Last Name"
                    value={regLastName}
                    onChange={(e) => setRegLastName(e.target.value)}
                  />
                </div>
                <Input
                  type="email"
                  placeholder="Email address"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
                <Input
                  type="password"
                  placeholder="Password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
                <Input
                  placeholder="Mobile Number"
                  value={regPhone}
                  onChange={(e) => setRegPhone(e.target.value)}
                />

                {/* Citizenship and ID */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="citizen"
                    checked={isSACitizen}
                    onCheckedChange={(checked) => setIsSACitizen(checked as boolean)}
                  />
                  <label htmlFor="citizen">
                    Are you a South African citizen?
                  </label>
                </div>
                <Input
                  placeholder="ID Number/Passport"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                />

                {/* Date of Birth */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal",
                        !dateOfBirth && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateOfBirth ? format(dateOfBirth, "PPP") : <span>Date of Birth</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateOfBirth}
                      onSelect={setDateOfBirth}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>

                {/* Gender and Language */}
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select Gender" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MALE">Male</SelectItem>
                    <SelectItem value="FEMALE">Female</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                    <SelectItem value="PREFER_NOT_TO_SAY">Prefer not to say</SelectItem>
                  </SelectContent>
                </Select>

                <Input
                  placeholder="Language"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                />

                {/* Banking Details */}
                <div className="space-y-4 border p-4 rounded-md">
                  <h3 className="font-semibold">Banking Details</h3>
                  <Input
                    placeholder="Account Holder Name"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                  />
                  <Input
                    placeholder="Bank Name"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                  />
                  <Input
                    placeholder="Branch & Code"
                    value={branchCode}
                    onChange={(e) => setBranchCode(e.target.value)}
                  />
                  <Input
                    placeholder="Account Number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                  />
                  <Select value={accountType} onValueChange={setAccountType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Type of Account" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SAVINGS">Savings</SelectItem>
                      <SelectItem value="CURRENT">Current</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Digital Signature */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium">Digital Signature</label>
                  <div className="border rounded-md p-2 bg-white">
                    <SignatureCanvas
                      ref={(ref) => setSignatureRef(ref)}
                      canvasProps={{
                        className: "signature-canvas w-full h-40",
                      }}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="mt-2"
                      onClick={() => signatureRef?.clear()}
                    >
                      Clear Signature
                    </Button>
                  </div>
                </div>

                {/* Mandate Acceptance */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="mandate"
                    checked={mandateAccepted}
                    onCheckedChange={(checked) => setMandateAccepted(checked as boolean)}
                  />
                  <label htmlFor="mandate" className="text-sm">
                    I accept the mandate for payment authorization
                  </label>
                </div>
              </div>

              {regError && (
                <div className="text-sm text-red-500 text-center">
                  {regError}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={registerMutation.isPending}
              >
                {registerMutation.isPending ? (
                  <div className="flex items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Registering...
                  </div>
                ) : (
                  "Register"
                )}
              </Button>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}