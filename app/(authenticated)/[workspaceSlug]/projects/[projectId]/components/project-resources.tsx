"use client";

import React, { useState, useEffect } from "react";
import { Sparkles, FileText, Link as LinkIcon, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useForm } from "@tanstack/react-form";
import { toast } from "sonner";

interface ProjectResourcesProps {
  projectId: string;
}

export function ProjectResources({ projectId }: ProjectResourcesProps) {
  const [projectBrief, setProjectBrief] = useState<string>("");
  const [isEditingBrief, setIsEditingBrief] = useState(false);
  const [links, setLinks] = useState<{ id: string; name: string; url: string }[]>([]);
  const [isAddingLink, setIsAddingLink] = useState(false);
  const [linkValidationErrors, setLinkValidationErrors] = useState<Record<string, string>>({});

  const linkForm = useForm({
    defaultValues: {
      name: "",
      url: "",
    },
    onSubmit: async ({ value }) => {
      setLinkValidationErrors({});
      if (!value.name.trim() || !value.url.trim()) return;

      // Add https:// if missing
      let url = value.url.trim();
      if (!/^https?:\/\//i.test(url)) {
        url = "https://" + url;
      }

      const updatedLinks = [...links, { id: crypto.randomUUID(), name: value.name.trim(), url }];
      setLinks(updatedLinks);
      localStorage.setItem(`veylo-project-links-${projectId}`, JSON.stringify(updatedLinks));

      linkForm.reset();
      setIsAddingLink(false);
      toast.success("Resource link added");
    },
  });

  useEffect(() => {
    if (isAddingLink) {
      linkForm.reset();
    }
  }, [isAddingLink, linkForm]);

  useEffect(() => {
    if (projectId) {
      // Load brief
      const savedBrief = localStorage.getItem(`veylo-project-brief-${projectId}`);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setProjectBrief(savedBrief || "Align your team around a shared vision with a project brief. Click edit to add context, goals, and outline project deliverables.");

      // Load links
      const savedLinks = localStorage.getItem(`veylo-project-links-${projectId}`);
      if (savedLinks) {
        try {
          setLinks(JSON.parse(savedLinks));
        } catch (e) {
          console.error(e);
        }
      } else {
        setLinks([
          { id: "1", name: "Figma Mockups", url: "https://figma.com" },
          { id: "2", name: "Project Spec Document", url: "https://google.com" }
        ]);
      }
    }
  }, [projectId]);

  const handleSaveBrief = () => {
    localStorage.setItem(`veylo-project-brief-${projectId}`, projectBrief);
    setIsEditingBrief(false);
    toast.success("Project brief saved");
  };

  const handleDeleteLink = (id: string) => {
    const updatedLinks = links.filter((l) => l.id !== id);
    setLinks(updatedLinks);
    localStorage.setItem(`veylo-project-links-${projectId}`, JSON.stringify(updatedLinks));
    toast.success("Resource link removed");
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2">
          <Sparkles className="h-4.5 w-4.5 text-primary" /> Key Resources
        </CardTitle>
        <CardDescription className="text-[10px] text-muted-foreground">
          Align your team around a shared vision with a project brief and supporting links.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Project Brief Section */}
        <div className="bg-muted/30 border border-border p-4 rounded-xl space-y-3">
          <div className="flex justify-between items-center pb-2 border-b border-border">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" /> Project Brief
            </span>
            {!isEditingBrief ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditingBrief(true)}
                className="h-7 px-2 text-muted-foreground hover:text-foreground text-[10px] uppercase font-bold"
              >
                Edit Brief
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  size="sm"
                  onClick={handleSaveBrief}
                  className="h-6 px-2 text-[10px]"
                >
                  Save
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditingBrief(false)}
                  className="h-6 px-2 text-muted-foreground hover:text-foreground text-[10px]"
                >
                  Cancel
                </Button>
              </div>
            )}
          </div>

          {isEditingBrief ? (
            <textarea
              value={projectBrief}
              onChange={(e) => setProjectBrief(e.target.value)}
              className="w-full min-h-[120px] bg-background border border-border rounded-md p-3 text-xs text-foreground focus:outline-none focus:border-primary resize-y font-normal"
            />
          ) : (
            <p className="text-muted-foreground text-xs leading-relaxed whitespace-pre-wrap font-normal font-sans">
              {projectBrief}
            </p>
          )}
        </div>

        {/* Resources Links Grid */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs font-bold text-foreground flex items-center gap-2">
              <LinkIcon className="h-4 w-4 text-muted-foreground" /> Reference Links
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddingLink(!isAddingLink)}
              className="h-7 text-[10px] uppercase font-bold"
            >
              <Plus className="h-3 w-3 mr-1" /> Add Link
            </Button>
          </div>

          {isAddingLink && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                e.stopPropagation();
                linkForm.handleSubmit();
              }}
              className="bg-muted/30 border border-border p-3 rounded-xl flex flex-col gap-2.5"
            >
              <div className="flex flex-col sm:flex-row gap-2.5">
                <linkForm.Field
                  name="name"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "Link name is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = [];
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err));
                    });
                    if (linkValidationErrors.name) fieldErrors.push(linkValidationErrors.name);
                    const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                    return (
                      <div className="flex-1 space-y-1">
                        <Input
                          type="text"
                          placeholder="e.g. Design Files"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setLinkValidationErrors((prev) => ({ ...prev, name: "" }));
                          }}
                          className="bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary h-8"
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </linkForm.Field>

                <linkForm.Field
                  name="url"
                  validators={{
                    onChange: ({ value }) => {
                      if (!value.trim()) return "URL is required";
                      return undefined;
                    },
                  }}
                >
                  {(field) => {
                    const fieldErrors: string[] = [];
                    field.state.meta.errors.forEach((err) => {
                      if (err) fieldErrors.push(String(err));
                    });
                    if (linkValidationErrors.url) fieldErrors.push(linkValidationErrors.url);
                    const hasError = field.state.meta.isTouched && !!fieldErrors.length;
                    return (
                      <div className="flex-1 space-y-1">
                        <Input
                          type="text"
                          placeholder="e.g. figma.com/project"
                          value={field.state.value}
                          onChange={(e) => {
                            field.handleChange(e.target.value);
                            setLinkValidationErrors((prev) => ({ ...prev, url: "" }));
                          }}
                          className="bg-background border border-border rounded px-2.5 py-1.5 text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:border-primary h-8"
                          aria-invalid={hasError}
                        />
                        {hasError && (
                          <p className="text-[11px] text-rose-500 font-medium mt-1">
                            {fieldErrors.join(", ")}
                          </p>
                        )}
                      </div>
                    );
                  }}
                </linkForm.Field>
              </div>
              <div className="flex gap-1.5 justify-end">
                <Button type="submit" size="sm" className="text-xs py-1.5">
                  Add
                </Button>
                <Button type="button" size="sm" variant="ghost" onClick={() => setIsAddingLink(false)} className="text-xs py-1.5">
                  Cancel
                </Button>
              </div>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {links.map((link) => (
              <div key={link.id} className="group flex items-center justify-between border p-2.5 rounded-xl hover:bg-muted/50 transition-colors">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2.5 text-xs text-primary font-semibold hover:underline truncate"
                >
                  <LinkIcon className="h-3.5 w-3.5 text-primary" />
                  <span className="truncate">{link.name}</span>
                </a>
                <button
                  onClick={() => handleDeleteLink(link.id)}
                  className="text-muted-foreground hover:text-destructive p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            ))}
            {links.length === 0 && (
              <div className="col-span-full py-4 text-center text-xs text-muted-foreground italic">
                No resource links added yet.
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
