import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser } from "@/hooks/use-user";
import { Link, useLocation } from "wouter";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useRef, useState } from "react";
import SignaturePad from 'react-signature-canvas';

const registerSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  isSouthAfrican: z.boolean(),
  idNumber: z.string().min(1, "ID Number/Passport is required"),
  dateOfBirth: z.string().min(1, "Date of birth is required"),
  gender: z.enum(["male", "female", "other"]),
  language: z.string().min(1, "Language is required"),
  mobileNumber: z.string().min(10, "Mobile number must be at least 10 digits"),
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  // Employment Details
  occupation: z.string().min(1, "Occupation is required"),
  industry: z.string().min(1, "Industry is required"),
  salaryBracket: z.string().min(1, "Salary bracket is required"),
  hasOwnCreditCard: z.boolean(),
  // Address Details
  addressLine1: z.string().min(1, "Address line 1 is required"),
  addressLine2: z.string().optional(),
  suburb: z.string().min(1, "Suburb is required"),
  postalCode: z.string().min(4, "Valid postal code is required"),
  agreeToTerms: z.boolean().refine((val) => val === true, {
    message: "You must agree to the terms and conditions",
  }),
  // Banking Details
  accountHolderName: z.string().min(1, "Account holder name is required"),
  bankName: z.string().min(1, "Bank name is required"),
  branchCode: z.string().min(1, "Branch code is required"),
  accountNumber: z.string().min(1, "Account number is required"),
  accountType: z.enum(["savings", "current"]),
  // Mandate Agreement
  signatureData: z.string().min(1, "Digital signature is required"),
  agreedToMandate: z.boolean().refine((val) => val === true, {
    message: "You must agree to the mandate",
  }),
});

type RegisterFormData = z.infer<typeof registerSchema>;

const languages = [
  "English",
  "Afrikaans",
  "Zulu",
  "Xhosa",
  "Sotho",
  "Tswana",
  "Venda",
  "Tsonga",
  "Swati",
  "Ndebele",
];

const salaryBrackets = [
  "R0 - R5,000",
  "R5,001 - R10,000",
  "R10,001 - R20,000",
  "R20,001 - R30,000",
  "R30,001 - R40,000",
  "R40,001 - R50,000",
  "Above R50,000"
];

const industries = [
  "Agriculture",
  "Mining",
  "Manufacturing",
  "Construction",
  "Retail",
  "Transportation",
  "Financial Services",
  "Technology",
  "Healthcare",
  "Education",
  "Government",
  "Other"
];

export default function RegisterPage() {
  const [, setLocation] = useLocation();
  const { register, user } = useUser();
  const signaturePadRef = useRef<SignaturePad>(null);
  const [currentStep, setCurrentStep] = useState(1);

  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      isSouthAfrican: false,
      idNumber: "",
      dateOfBirth: "",
      gender: "male",
      language: "",
      mobileNumber: "",
      email: "",
      password: "",
      occupation: "",
      industry: "",
      salaryBracket: "",
      hasOwnCreditCard: false,
      addressLine1: "",
      addressLine2: "",
      suburb: "",
      postalCode: "",
      agreeToTerms: false,
      accountHolderName: "",
      bankName: "",
      branchCode: "",
      accountNumber: "",
      accountType: "savings",
      signatureData: "",
      agreedToMandate: false,
    },
  });

  if (user) {
    setLocation("/");
    return null;
  }

  const onSubmit = async (data: RegisterFormData) => {
    if (currentStep !== 3) {
      setCurrentStep(currentStep + 1);
      return;
    }

    const result = await register({
      email: data.email,
      password: data.password,
      firstName: data.firstName,
      lastName: data.lastName,
      isSouthAfricanCitizen: data.isSouthAfrican,
      idOrPassport: data.idNumber,
      dateOfBirth: data.dateOfBirth,
      gender: data.gender,
      language: data.language,
      mobileNumber: data.mobileNumber,
      occupation: data.occupation,
      industry: data.industry,
      salaryBracket: data.salaryBracket,
      hasOwnCreditCard: data.hasOwnCreditCard,
      addressLine1: data.addressLine1,
      addressLine2: data.addressLine2,
      suburb: data.suburb,
      postalCode: data.postalCode,
      accountHolderName: data.accountHolderName,
      bankName: data.bankName,
      branchCode: data.branchCode,
      accountNumber: data.accountNumber,
      accountType: data.accountType,
      signatureData: data.signatureData,
      agreedToMandate: data.agreedToMandate,
    });

    if (result.ok) {
      setLocation("/");
    }
  };

  const goToPreviousStep = () => {
    setCurrentStep(currentStep - 1);
  };

  const renderStepIndicator = () => (
    <div className="flex justify-center mb-6">
      <div className="flex items-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`rounded-full w-8 h-8 flex items-center justify-center ${
                step === currentStep
                  ? "bg-primary text-primary-foreground"
                  : step < currentStep
                  ? "bg-primary/20 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`h-px w-8 mx-2 ${
                  step < currentStep ? "bg-primary" : "bg-muted"
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );

  const renderPersonalInformation = () => (
    <div className="space-y-4">
      <h3 className="text-lg font-medium">Personal Information</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="firstName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>First Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="lastName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Last Name</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={form.control}
        name="isSouthAfrican"
        render={({ field }) => (
          <FormItem className="flex flex-row items-center space-x-3 space-y-0">
            <FormControl>
              <Checkbox
                checked={field.value}
                onCheckedChange={field.onChange}
              />
            </FormControl>
            <div className="space-y-1 leading-none">
              <FormLabel>
                Are you a South African citizen?
              </FormLabel>
            </div>
          </FormItem>
        )}
      />

      <FormField
        control={form.control}
        name="idNumber"
        render={({ field }) => (
          <FormItem>
            <FormLabel>ID Number/Passport</FormLabel>
            <FormControl>
              <Input {...field} />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select gender" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="male">Male</SelectItem>
                  <SelectItem value="female">Female</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="language"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Language</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang.toLowerCase()}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="mobileNumber"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number</FormLabel>
              <FormControl>
                <Input type="tel" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );

  const renderEmploymentAndAddress = () => (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Employment Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="occupation"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Occupation</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="industry"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Industry</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {industries.map((industry) => (
                      <SelectItem key={industry} value={industry.toLowerCase()}>
                        {industry}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="salaryBracket"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Salary Bracket</FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select salary bracket" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {salaryBrackets.map((bracket) => (
                    <SelectItem key={bracket} value={bracket}>
                      {bracket}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="hasOwnCreditCard"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>Do you own a credit card?</FormLabel>
              </div>
            </FormItem>
          )}
        />
      </div>
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Address Details</h3>
        <FormField
          control={form.control}
          name="addressLine1"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 1</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="addressLine2"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Address Line 2 (Optional)</FormLabel>
              <FormControl>
                <Input {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="suburb"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Suburb</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="postalCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Postal Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </>
  );

  const renderMandateAndBanking = () => (
    <>
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Banking Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField
            control={form.control}
            name="accountHolderName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Holder Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bankName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bank Name</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="branchCode"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Branch & Code</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Account Number</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="accountType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Type of Account</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select account type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="savings">Savings</SelectItem>
                    <SelectItem value="current">Current</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
      <div className="space-y-4 mt-6">
        <h3 className="text-lg font-medium">Mandate Agreement</h3>
        <div className="text-sm space-y-4 bg-muted p-4 rounded-lg">
          <p>Authority and Mandate for Payments</p>
          <p>This signed Authority and Mandate refers to our contract dated: {new Date().toLocaleDateString()}</p>
          <p>I / We hereby authorise you to issue and deliver payment instructions of R550 per month for the program fee to your Banker for collection against my / our abovementioned account at my / our above-mentioned Bank (or any other bank or branch to which I / we may transfer my / our account) on condition that the sum of such payment instructions will never exceed my / our obligations as agreed to in the Agreement and commencing on the 1st of each month and continuing until this Authority and Mandate is terminated by me / us by giving you notice in writing of not less than 20 ordinary working days, and sent by prepaid registered post or delivered to your address as indicated above.</p>
          <p>The individual payment instructions so authorised to be issued must be issued and delivered as follows: R550 monthly.</p>
          <p>In the event that the payment day falls on a Sunday, or a recognised South African public holiday, the payment day will automatically be the preceding ordinary business day.</p>
          <p>I / We understand that the withdrawals hereby authorized will be processed through a computerized system provided by the South African Banks, and I also understand that details of each withdrawal will be printed on my bank statement. Each transaction will contain a number, which must be included in the said payment instruction and if provided to you should enable you to identify the Agreement.</p>
        </div>

        <FormField
          control={form.control}
          name="agreedToMandate"
          render={({ field }) => (
            <FormItem className="flex flex-row items-start space-x-3 space-y-0">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <div className="space-y-1 leading-none">
                <FormLabel>
                  I agree to the mandate terms and conditions
                </FormLabel>
              </div>
            </FormItem>
          )}
        />

        <div className="space-y-2">
          <FormLabel>Digital Signature</FormLabel>
          <div className="border rounded-md p-2">
            <SignaturePad
              ref={signaturePadRef}
              canvasProps={{
                className: "w-full h-40 border rounded-md",
              }}
              onEnd={() => {
                if (signaturePadRef.current) {
                  const signatureData = signaturePadRef.current.toDataURL();
                  form.setValue("signatureData", signatureData);
                }
              }}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              if (signaturePadRef.current) {
                signaturePadRef.current.clear();
                form.setValue("signatureData", "");
              }
            }}
          >
            Clear Signature
          </Button>
        </div>
      </div>
    </>
  );

  const stepContent = {
    1: {
      title: "Create Account",
      description: "Enter your personal information",
      content: renderPersonalInformation,
    },
    2: {
      title: "Employment & Address",
      description: "Tell us about your work and where you live",
      content: renderEmploymentAndAddress,
    },
    3: {
      title: "Banking & Mandate",
      description: "Set up your payment details",
      content: renderMandateAndBanking,
    },
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl my-8">
        <CardHeader>
          <CardTitle>{stepContent[currentStep as keyof typeof stepContent].title}</CardTitle>
          <CardDescription>
            {stepContent[currentStep as keyof typeof stepContent].description}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {renderStepIndicator()}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {stepContent[currentStep as keyof typeof stepContent].content()}

              <div className="flex justify-between gap-4">
                {currentStep > 1 && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={goToPreviousStep}
                  >
                    Previous
                  </Button>
                )}
                <Button
                  type="submit"
                  className={currentStep === 1 ? "w-full" : "flex-1"}
                  disabled={form.formState.isSubmitting}
                >
                  {currentStep === 3
                    ? form.formState.isSubmitting
                      ? "Creating Account..."
                      : "Complete Registration"
                    : "Continue"}
                </Button>
              </div>

              {currentStep === 1 && (
                <div className="text-sm text-center">
                  Already have an account?{" "}
                  <Link href="/auth/login" className="text-primary hover:underline">
                    Login here
                  </Link>
                </div>
              )}
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}