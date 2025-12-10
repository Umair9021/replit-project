import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import {
  User,
  Mail,
  Phone,
  Shield,
  ShieldCheck,
  ShieldX,
  Clock,
  Upload,
  Loader2,
  Car,
  Users,
  ArrowLeftRight,
} from "lucide-react";

const profileSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  phone: z.string().optional(),
  role: z.enum(["passenger", "driver", "both"]),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const cnicStatusConfig = {
  not_uploaded: {
    label: "Not Uploaded",
    icon: Shield,
    className: "bg-muted text-muted-foreground",
    description: "Upload your CNIC to get verified as a driver",
  },
  pending: {
    label: "Pending Review",
    icon: Clock,
    className: "bg-yellow-500/10 text-yellow-600",
    description: "Your CNIC is being reviewed by our team",
  },
  verified: {
    label: "Verified",
    icon: ShieldCheck,
    className: "bg-green-500/10 text-green-600",
    description: "Your identity has been verified",
  },
  rejected: {
    label: "Rejected",
    icon: ShieldX,
    className: "bg-red-500/10 text-red-600",
    description: "Your CNIC was rejected. Please upload a clearer image",
  },
};

export default function Profile() {
  const { user, login } = useAuth();
  const { toast } = useToast();
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || "",
      phone: user?.phone || "",
      role: user?.role || "passenger",
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: ProfileFormData) => {
      return apiRequest("PATCH", `/api/users/${user?.id}`, data);
    },
    onSuccess: (updatedUser) => {
      login({ ...user!, ...updatedUser });
      toast({
        title: "Profile updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const uploadCnicMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append("cnic", file);
      const response = await fetch(`/api/users/${user?.id}/cnic`, {
        method: "POST",
        body: formData,
      });
      if (!response.ok) {
        throw new Error("Upload failed");
      }
      return response.json();
    },
    onSuccess: (updatedUser) => {
      login({ ...user!, cnicStatus: "pending" });
      toast({
        title: "CNIC uploaded",
        description: "Your CNIC has been submitted for verification.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Upload failed",
        description: error.message || "Please try again",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data);
  };

  const handleCnicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please upload an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }
      uploadCnicMutation.mutate(file);
    }
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const cnicStatus = cnicStatusConfig[user?.cnicStatus || "not_uploaded"];
  const CnicIcon = cnicStatus.icon;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-4xl px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 border-4 border-primary/10">
                  <AvatarImage src={user?.avatar || undefined} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials(user?.name || "U")}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle className="text-2xl">{user?.name}</CardTitle>
                  <CardDescription className="flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {user?.email}
                  </CardDescription>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant="secondary">
                      {user?.role === "both"
                        ? "Driver & Passenger"
                        : user?.role === "driver"
                        ? "Driver"
                        : "Passenger"}
                    </Badge>
                    {user?.cnicStatus === "verified" && (
                      <Badge className="bg-green-500/10 text-green-600">
                        <ShieldCheck className="h-3 w-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Update your personal details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Full Name</FormLabel>
                        <FormControl>
                          <Input {...field} data-testid="input-profile-name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone Number</FormLabel>
                        <FormControl>
                          <Input
                            type="tel"
                            placeholder="03XX-XXXXXXX"
                            {...field}
                            data-testid="input-profile-phone"
                          />
                        </FormControl>
                        <FormDescription>
                          Your phone number will be shared with ride partners
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="role"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Account Type</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger data-testid="select-profile-role">
                              <SelectValue placeholder="Select your role" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="passenger">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                <span>Passenger Only</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="driver">
                              <div className="flex items-center gap-2">
                                <Car className="h-4 w-4" />
                                <span>Driver Only</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="both">
                              <div className="flex items-center gap-2">
                                <ArrowLeftRight className="h-4 w-4" />
                                <span>Both (Driver & Passenger)</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <Button
                    type="submit"
                    disabled={updateProfileMutation.isPending}
                    data-testid="button-save-profile"
                  >
                    {updateProfileMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    Save Changes
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          {(user?.role === "driver" || user?.role === "both") && (
            <Card>
              <CardHeader>
                <CardTitle>Driver Verification</CardTitle>
                <CardDescription>
                  Upload your CNIC to verify your identity and build trust with
                  passengers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 mb-6">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${cnicStatus.className}`}
                  >
                    <CnicIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="font-medium">{cnicStatus.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {cnicStatus.description}
                    </p>
                  </div>
                </div>

                {(user?.cnicStatus === "not_uploaded" ||
                  user?.cnicStatus === "rejected") && (
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
                    <p className="font-medium mb-2">Upload CNIC Image</p>
                    <p className="text-sm text-muted-foreground mb-4">
                      JPG, PNG or PDF up to 5MB
                    </p>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        onChange={handleCnicUpload}
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        disabled={uploadCnicMutation.isPending}
                        data-testid="input-cnic-upload"
                      />
                      <Button disabled={uploadCnicMutation.isPending}>
                        {uploadCnicMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Uploading...
                          </>
                        ) : (
                          <>
                            <Upload className="mr-2 h-4 w-4" />
                            Choose File
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
