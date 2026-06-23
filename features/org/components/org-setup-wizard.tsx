"use client";

import { useState, useRef } from "react";
import { useForm } from "@tanstack/react-form";
import { zodValidator } from "@tanstack/zod-form-adapter";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { 
  Building03Icon, 
  Folder01Icon, 
  Upload04Icon 
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Field, FieldError } from "@/components/ui/field";
import { axiosInstance } from "@/lib/axios";
import { authClient } from "@/lib/auth-client";

const orgSetupSchema = z.object({
  name: z.string().min(2, "Organization name must be at least 2 characters"),
  slug: z.string().min(2, "Slug must be at least 2 characters").regex(/^[a-z0-9-]+$/, "Lowercase letters, numbers, and hyphens only"),
  workspaceName: z.string().min(2, "Workspace name must be at least 2 characters"),
});

export function OrgSetupWizard() {
  const queryClient = useQueryClient();
  const [step, setStep] = useState<1 | 2>(1);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm({
     
    ...( {
      defaultValues: {
        name: "",
        slug: "",
        workspaceName: "",
      },
      validatorAdapter: zodValidator(),
      onSubmit: async ({ value }: { value: { name: string, slug: string, workspaceName: string } }) => {
        try {
          const formData = new FormData();
          formData.append("name", value.name);
          formData.append("slug", value.slug);
          formData.append("workspaceName", value.workspaceName);
          if (logoFile) {
            formData.append("logo", logoFile);
          }

          await axiosInstance.post("/org/setup", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          // Force reload auth session
          await queryClient.invalidateQueries({ queryKey: ["auth"] });
          await authClient.getSession();
          
          toast.success("Organization & Workspace created!");

          // Redirect to new tenant subdomain
          const protocol = window.location.protocol;
          const hostParts = window.location.host.split('.');
          // If already on a subdomain, replace it. Otherwise prepend.
          // Assuming base domain is localhost:3000 or veylo.com
          const baseDomain = hostParts.length > 1 && !window.location.host.startsWith('localhost') 
            ? hostParts.slice(-2).join('.') 
            : window.location.host;
            
          window.location.href = `${protocol}//${value.slug}.${baseDomain}/dashboard`;

        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { data?: { message?: string } } };
            toast.error(axiosError.response?.data?.message || "Failed to create organization");
          } else {
            toast.error("Failed to create organization");
          }
        }
      },
    }),
  });

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("Logo must be less than 5MB");
        return;
      }
      setLogoFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const autoGenerateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_]+/g, "-")
      .replace(/[^\w-]+/g, "")
      .replace(/(^-|-$)+/g, "");
  };

  const nextStep = async () => {
    // Simple manual validation for step 1
    const values = form.state.values as { name: string, slug: string };
    if (values.name.length < 2 || !/^[a-z0-9-]+$/.test(values.slug)) {
       form.validateAllFields("change");
       return;
    }
    setStep(2);
  };

  return (
    <div className="flex flex-col space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold tracking-tight">
          {step === 1 ? "Set up your organization" : "Create your first workspace"}
        </h1>
        <p className="text-muted-foreground text-sm">
          {step === 1 
            ? "This represents your company or team." 
            : "Workspaces organize your projects and boards."}
        </p>
      </div>

      {/* Progress Indicator */}
      <div className="flex items-center justify-center gap-2 mb-4">
         <div className={`h-2 w-12 rounded-full transition-colors ${step >= 1 ? "bg-primary" : "bg-muted"}`} />
         <div className={`h-2 w-12 rounded-full transition-colors ${step >= 2 ? "bg-primary" : "bg-muted"}`} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          e.stopPropagation();
          form.handleSubmit();
        }}
        className="space-y-6"
      >
        {step === 1 && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
            <div className="flex flex-col items-center justify-center space-y-4">
               <div 
                  className="relative flex size-24 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/25 bg-muted/50 transition-colors hover:bg-muted"
                  onClick={() => fileInputRef.current?.click()}
               >
                 {logoPreview ? (
                   // eslint-disable-next-line @next/next/no-img-element
                   <img src={logoPreview} alt="Logo preview" className="size-full rounded-xl object-cover" />
                 ) : (
                   <div className="flex flex-col items-center text-muted-foreground">
                      <HugeiconsIcon icon={Upload04Icon} size={24} className="mb-1" />
                      <span className="text-[10px] font-medium uppercase tracking-wider">Upload Logo</span>
                   </div>
                 )}
                 <input 
                   type="file" 
                   ref={fileInputRef} 
                   className="hidden" 
                   accept="image/*" 
                   onChange={handleLogoChange}
                 />
               </div>
               <p className="text-xs text-muted-foreground">Optional, max 5MB</p>
            </div>

            <form.Field
              name="name"
              validators={{ onChange: orgSetupSchema.shape.name }}
              listeners={{
                onChange: ({ value }: { value: string }) => {
                  const currentSlug = form.getFieldValue("slug");
                  // Auto-update slug if it's empty or matches the auto-generated pattern of the old name
                  if (!currentSlug || currentSlug === autoGenerateSlug(value.slice(0, -1))) {
                     form.setFieldValue("slug", autoGenerateSlug(value));
                  }
                }
              }}
            >
              {(field) => (
                <Field>
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    <HugeiconsIcon icon={Building03Icon} size={16} />
                    Organization Name
                  </Label>
                  <Input
                    id={field.name}
                    placeholder="e.g. Acme Corp"
                    value={field.state.value as string}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Field
              name="slug"
              validators={{ onChange: orgSetupSchema.shape.slug }}
            >
              {(field) => (
                <Field>
                  <Label htmlFor={field.name}>URL Slug</Label>
                  <div className="flex rounded-md shadow-sm">
                    <span className="inline-flex items-center rounded-l-md border border-r-0 border-input bg-muted px-3 text-muted-foreground sm:text-sm">
                      https://
                    </span>
                    <Input
                      id={field.name}
                      className="rounded-l-none"
                      placeholder="acme-corp"
                      value={field.state.value as string}
                      onBlur={field.handleBlur}
                      onChange={(e) => field.handleChange(e.target.value.toLowerCase())}
                    />
                    <span className="inline-flex items-center rounded-r-md border border-l-0 border-input bg-muted px-3 text-muted-foreground sm:text-sm">
                      .veylo.test
                    </span>
                  </div>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <Button type="button" className="w-full mt-6" onClick={nextStep}>
              Continue
            </Button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-5 animate-in slide-in-from-right-4">
             <form.Field
              name="workspaceName"
              validators={{ onChange: orgSetupSchema.shape.workspaceName }}
            >
              {(field) => (
                <Field>
                  <Label htmlFor={field.name} className="flex items-center gap-2">
                    <HugeiconsIcon icon={Folder01Icon} size={16} />
                    Workspace Name
                  </Label>
                  <Input
                    id={field.name}
                    placeholder="e.g. Engineering, Marketing"
                    value={field.state.value as string}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                  />
                  <p className="text-xs text-muted-foreground mt-1.5">
                    Workspaces are dedicated areas for specific teams or large projects.
                  </p>
                  <FieldError errors={field.state.meta.errors} />
                </Field>
              )}
            </form.Field>

            <form.Subscribe
              selector={(state) => [state.canSubmit, state.isSubmitting]}
            >
              {([canSubmit, isSubmitting]) => (
                <div className="flex gap-3 mt-6">
                  <Button 
                    type="button" 
                    variant="outline" 
                    className="flex-1"
                    onClick={() => setStep(1)}
                    disabled={isSubmitting}
                  >
                    Back
                  </Button>
                  <Button 
                    type="submit" 
                    className="flex-1"
                    disabled={!canSubmit || isSubmitting}
                  >
                    {isSubmitting ? "Creating..." : "Finish Set up"}
                  </Button>
                </div>
              )}
            </form.Subscribe>
          </div>
        )}
      </form>
    </div>
  );
}
