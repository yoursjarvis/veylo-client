"use client";

import React, { useState, useRef, useEffect } from "react";
import { useQuery, useInfiniteQuery, useMutation } from "@tanstack/react-query";
import { useVirtualizer } from "@tanstack/react-virtual";
import {
  Search,
  Download,
  Filter,
  RotateCcw,
  Calendar as CalendarIcon,
  Info,
  Laptop,
  Globe,
  Database,
  CheckSquare,
} from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";

import { axiosInstance } from "@/lib/axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { MultiSearchableSelect } from "@/components/ui/multi-searchable-select";
import { cn } from "@/lib/utils";
import { useQueryState, parseAsString, parseAsArrayOf, parseAsInteger } from "nuqs";

interface OrgMember {
  id: string;
  userId: string;
  role: string;
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

interface AuditLogEntry {
  id: string;
  action: string;
  entityType: string;
  entityId: string | null;
  entityName: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
  user: {
    name: string;
    email: string;
    image?: string | null;
  };
}

interface PaginatedAuditLogs {
  data: AuditLogEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

const AVAILABLE_ACTIONS = [
  { value: "USER_SIGN_IN", label: "User Sign In" },
  { value: "CREATE_INVITATION", label: "Create Invitation" },
  { value: "CANCEL_INVITATION", label: "Cancel Invitation" },
  { value: "CREATE_PROJECT", label: "Create Project" },
  { value: "UPDATE_PROJECT", label: "Update Project" },
  { value: "DELETE_PROJECT", label: "Delete Project" },
  { value: "RESTORE_PROJECT", label: "Restore Project" },
  { value: "FORCE_DELETE_PROJECT", label: "Force Delete Project" },
  { value: "CREATE_WORKSPACE", label: "Create Workspace" },
  { value: "UPDATE_WORKSPACE", label: "Update Workspace" },
  { value: "DELETE_WORKSPACE", label: "Delete Workspace" },
  { value: "RESTORE_WORKSPACE", label: "Restore Workspace" },
  { value: "FORCE_DELETE_WORKSPACE", label: "Force Delete Workspace" },
  { value: "CREATE_ROLE", label: "Create Role" },
  { value: "UPDATE_ROLE", label: "Update Role Settings" },
  { value: "DELETE_ROLE", label: "Delete Role" },
  { value: "CREATE_TASK", label: "Create Task" },
  { value: "UPDATE_TASK", label: "Update Task" },
  { value: "DELETE_TASK", label: "Delete Task" },
  { value: "RESTORE_TASK", label: "Restore Task" },
  { value: "FORCE_DELETE_TASK", label: "Force Delete Task" },
  { value: "CREATE_SPRINT", label: "Create Sprint" },
  { value: "UPDATE_SPRINT", label: "Update Sprint" },
  { value: "DELETE_SPRINT", label: "Delete Sprint" },
  { value: "RESTORE_SPRINT", label: "Restore Sprint" },
  { value: "FORCE_DELETE_SPRINT", label: "Force Delete Sprint" },
  { value: "CREATE_EPIC", label: "Create Epic" },
  { value: "UPDATE_EPIC", label: "Update Epic" },
  { value: "DELETE_EPIC", label: "Delete Epic" },
  { value: "RESTORE_EPIC", label: "Restore Epic" },
  { value: "FORCE_DELETE_EPIC", label: "Force Delete Epic" },
  { value: "CREATE_LABEL", label: "Create Label" },
  { value: "UPDATE_LABEL", label: "Update Label" },
  { value: "DELETE_LABEL", label: "Delete Label" },
  { value: "RESTORE_LABEL", label: "Restore Label" },
  { value: "FORCE_DELETE_LABEL", label: "Force Delete Label" },
  { value: "CREATE_COMMENT", label: "Add Comment" },
  { value: "UPDATE_COMMENT", label: "Update Comment" },
  { value: "DELETE_COMMENT", label: "Delete Comment" },
  { value: "CREATE_CUSTOM_FIELD", label: "Create Custom Field" },
  { value: "UPDATE_CUSTOM_FIELD", label: "Update Custom Field" },
  { value: "DELETE_CUSTOM_FIELD", label: "Delete Custom Field" },
  { value: "CREATE_TASK_STATUS", label: "Create Task Status" },
  { value: "UPDATE_TASK_STATUS", label: "Update Task Status" },
  { value: "DELETE_TASK_STATUS", label: "Delete Task Status" },
  { value: "CREATE_AUTOMATION", label: "Create Automation" },
  { value: "UPDATE_AUTOMATION", label: "Update Automation" },
  { value: "DELETE_AUTOMATION", label: "Delete Automation" },
  { value: "CREATE_VAULT", label: "Create Vault" },
  { value: "UPDATE_VAULT", label: "Update Vault" },
  { value: "DELETE_VAULT", label: "Delete Vault" },
  { value: "CREATE_VAULT_SERVICE", label: "Create Vault Service" },
  { value: "UPDATE_VAULT_SERVICE", label: "Update Vault Service" },
  { value: "DELETE_VAULT_SERVICE", label: "Delete Vault Service" },
  { value: "CREATE_VAULT_ITEM", label: "Create Vault Item" },
  { value: "UPDATE_VAULT_ITEM", label: "Update Vault Item" },
  { value: "DELETE_VAULT_ITEM", label: "Delete Vault Item" },
];

export default function OrganizationAuditLogsPage() {
  // Filters State using nuqs for shareable URL query parameters
  const [search, setSearch] = useQueryState(
    "search",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true, shallow: true })
  );

  const [selectedMembers, setSelectedMembers] = useQueryState(
    "members",
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({ clearOnDefault: true, shallow: true })
  );

  const [selectedActions, setSelectedActions] = useQueryState(
    "actions",
    parseAsArrayOf(parseAsString).withDefault([]).withOptions({ clearOnDefault: true, shallow: true })
  );

  const [startDateStr, setStartDateStr] = useQueryState(
    "startDate",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true, shallow: true })
  );

  const [endDateStr, setEndDateStr] = useQueryState(
    "endDate",
    parseAsString.withDefault("").withOptions({ clearOnDefault: true, shallow: true })
  );

  const [, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true, shallow: true })
  );

  const startDate = startDateStr ? new Date(startDateStr) : undefined;
  const endDate = endDateStr ? new Date(endDateStr) : undefined;

  const setStartDate = (date: Date | undefined) => {
    setStartDateStr(date ? format(date, "yyyy-MM-dd") : "");
  };

  const setEndDate = (date: Date | undefined) => {
    setEndDateStr(date ? format(date, "yyyy-MM-dd") : "");
  };

  const [limit] = useState(15);

  // Advanced Filters toggle
  const [showFilters, setShowFilters] = useState(false);

  // Modal State for JSON Metadata View
  const [selectedMetadata, setSelectedMetadata] = useState<Record<string, unknown> | null>(null);

  // Fetch Org Members for filter list
  const { data: members = [] } = useQuery<OrgMember[]>({
    queryKey: ["org-members"],
    queryFn: async () => {
      const res = await axiosInstance.get("/org/members?limit=100");
      return res.data.data.members || [];
    },
  });

  // Fetch Audit Logs with filters (using Infinite Query for virtual scrolling)
  const {
    data: logsData,
    isLoading: isLogsLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery<PaginatedAuditLogs>({
    queryKey: [
      "org-audit-logs",
      search,
      selectedMembers,
      selectedActions,
      startDateStr,
      endDateStr,
      limit,
    ],
    queryFn: async ({ pageParam = 1 }) => {
      const params = new URLSearchParams();
      params.append("page", String(pageParam));
      params.append("limit", String(limit));

      if (search) params.append("search", search);
      if (startDate) params.append("startDate", format(startDate, "yyyy-MM-dd"));
      if (endDate) params.append("endDate", format(endDate, "yyyy-MM-dd"));

      selectedMembers.forEach((id) => params.append("memberIds", id));
      selectedActions.forEach((action) => params.append("actions", action));

      const res = await axiosInstance.get(`/org/audit-logs?${params.toString()}`);
      return res.data.data;
    },
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.meta.page + 1;
      return nextPage <= lastPage.meta.totalPages ? nextPage : undefined;
    },
    initialPageParam: 1,
  });

  const parentRef = useRef<HTMLDivElement>(null);

  const allRows = logsData ? logsData.pages.flatMap((page) => page.data) : [];

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allRows.length + 1 : allRows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 64, // estimated row height
    overscan: 5,
  });

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  useEffect(() => {
    const [lastItem] = [...virtualRows].reverse();
    if (!lastItem) return;

    if (
      lastItem.index >= allRows.length - 1 &&
      hasNextPage &&
      !isFetchingNextPage
    ) {
      fetchNextPage();
    }
  }, [hasNextPage, fetchNextPage, allRows.length, isFetchingNextPage, virtualRows]);

  // Export Mutation
  const exportMutation = useMutation({
    mutationFn: async () => {
      await axiosInstance.post("/org/audit-logs/export", {
        search: search || undefined,
        startDate: startDate ? format(startDate, "yyyy-MM-dd") : undefined,
        endDate: endDate ? format(endDate, "yyyy-MM-dd") : undefined,
        memberIds: selectedMembers.length ? selectedMembers : undefined,
        actions: selectedActions.length ? selectedActions : undefined,
      });
    },
    onSuccess: () => {
      toast.success(
        "Export started in the background. You will receive an email and in-app notification when the CSV file is ready.",
        { duration: 6000 }
      );
    },
    onError: (err: unknown) => {
      const errorMsg =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Failed to start export.";
      toast.error(errorMsg);
    },
  });

  // Clear all filters
  const handleResetFilters = () => {
    setSearch("");
    setSelectedMembers([]);
    setSelectedActions([]);
    setStartDateStr("");
    setEndDateStr("");
    setPage(1);
  };

  const getActionBadgeVariant = (
    action: string
  ): "default" | "secondary" | "destructive" | "outline" | "ghost" | "link" => {
    if (action.startsWith("CREATE")) return "default";
    if (action.startsWith("DELETE") || action.startsWith("FORCE") || action.startsWith("REMOVE")) return "destructive";
    if (action.startsWith("RESTORE")) return "secondary";
    if (action.includes("ROLE")) return "outline";
    return "default";
  };

  const formatBrowser = (userAgent: string | null) => {
    if (!userAgent) return "Unknown Browser";
    if (userAgent.includes("Chrome")) return "Chrome";
    if (userAgent.includes("Safari") && !userAgent.includes("Chrome")) return "Safari";
    if (userAgent.includes("Firefox")) return "Firefox";
    if (userAgent.includes("Edge")) return "Edge";
    return "Web Browser";
  };

  const memberOptions = members.map((m) => ({
    value: m.userId,
    label: `${m.user.name} (${m.user.email})`,
  }));

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <div className="flex-1 px-8 py-8 space-y-6 max-w-7xl mx-auto w-full">
        {/* Header Section */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between border-b pb-6 border-border">
          <div className="space-y-1">
            <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Organization Audit Logs
            </h1>
            <p className="text-muted-foreground text-sm">
              Immutable ledger of administrative and configuration events across all workspaces.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              {showFilters ? "Hide Filters" : "Show Filters"}
            </Button>
            <Button
              size="sm"
              onClick={() => exportMutation.mutate()}
              disabled={exportMutation.isPending}
              className="flex items-center gap-2 shadow-sm font-semibold"
            >
              <Download className="h-4 w-4" />
              {exportMutation.isPending ? "Exporting..." : "Export CSV"}
            </Button>
          </div>
        </div>

        {/* Filters Panel */}
        {(showFilters || search || selectedMembers.length > 0 || selectedActions.length > 0 || startDate || endDate) && (
          <Card className="border border-border/80 bg-card shadow-sm transition-all duration-200">
            <CardHeader className="py-4 border-b border-border/50 bg-muted/20">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Filter className="h-4 w-4 text-primary" /> Filter Options
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleResetFilters}
                  className="h-8 text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5"
                >
                  <RotateCcw className="h-3 w-3" /> Clear All Filters
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                {/* Search Input */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Search Ledger
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search descriptions, entities..."
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setPage(1);
                      }}
                      className="pl-9 h-10 border-input bg-background focus-visible:ring-1"
                    />
                  </div>
                </div>

                {/* Date Picker Start */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Start Date
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full h-10 pl-3 pr-8 text-left font-normal border border-input rounded-lg bg-transparent hover:bg-muted/10 relative transition-colors outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !startDate && "text-muted-foreground"
                      )}
                    >
                      {startDate ? format(startDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-card border border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={(date) => {
                          setStartDate(date);
                          setPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Date Picker End */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    End Date
                  </label>
                  <Popover>
                    <PopoverTrigger
                      className={cn(
                        "w-full h-10 pl-3 pr-8 text-left font-normal border border-input rounded-lg bg-transparent hover:bg-muted/10 relative transition-colors outline-hidden focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
                        !endDate && "text-muted-foreground"
                      )}
                    >
                      {endDate ? format(endDate, "PPP") : <span>Pick a date</span>}
                      <CalendarIcon className="absolute right-3 top-2.5 h-4 w-4 opacity-50 pointer-events-none shrink-0" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 z-50 bg-card border border-border" align="start">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={(date) => {
                          setEndDate(date);
                          setPage(1);
                        }}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              {/* Members Selection & Action Selection */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 pt-4 border-t border-border/50">
                {/* Members Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Filter by Members
                  </label>
                  <MultiSearchableSelect
                    value={selectedMembers}
                    onValueChange={(val) => {
                      setSelectedMembers(val);
                      setPage(1);
                    }}
                    options={memberOptions}
                    placeholder="Select organization members..."
                    searchPlaceholder="Search members..."
                  />
                </div>

                {/* Actions Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Filter by Actions
                  </label>
                  <MultiSearchableSelect
                    value={selectedActions}
                    onValueChange={(val) => {
                      setSelectedActions(val);
                      setPage(1);
                    }}
                    options={AVAILABLE_ACTIONS}
                    placeholder="Select actions..."
                    searchPlaceholder="Search actions..."
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Ledger Table Section */}
        <Card className="border border-border/80 bg-card shadow-sm overflow-hidden">
          <CardContent className="p-0">
            {isLogsLoading ? (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1100px] flex flex-col">
                  {/* Skeleton Header */}
                  <div className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border bg-muted/30 py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div>Timestamp</div>
                    <div>Actor</div>
                    <div>Action</div>
                    <div>Entity</div>
                    <div>Description</div>
                    <div>Origin IP</div>
                    <div className="text-center">Data</div>
                  </div>
                  {/* Skeleton Rows */}
                  <div className="flex flex-col divide-y divide-border/40">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <div
                        key={index}
                        className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center py-4 px-4 min-h-[64px]"
                      >
                        {/* Timestamp */}
                        <div className="pr-2">
                          <Skeleton className="h-4 w-28" />
                        </div>
                        {/* Actor */}
                        <div className="pr-2 flex items-center gap-2">
                          <Skeleton className="h-6 w-6 rounded-full" />
                          <div className="space-y-1 flex-1">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-2 w-28" />
                          </div>
                        </div>
                        {/* Action */}
                        <div className="pr-2">
                          <Skeleton className="h-5 w-24 rounded-full" />
                        </div>
                        {/* Entity */}
                        <div className="pr-2 space-y-1">
                          <Skeleton className="h-2 w-12" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        {/* Description */}
                        <div className="pr-2">
                          <Skeleton className="h-4 w-full max-w-[200px]" />
                        </div>
                        {/* Origin IP */}
                        <div className="pr-2 space-y-1">
                          <Skeleton className="h-3 w-16" />
                          <Skeleton className="h-2 w-20" />
                        </div>
                        {/* Data */}
                        <div className="flex justify-center">
                          <Skeleton className="h-8 w-8 rounded-md" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : !allRows.length ? (
              <div className="py-20 flex flex-col items-center justify-center text-center px-4">
                <Info className="h-10 w-10 text-muted-foreground mb-4" />
                <h3 className="text-base font-semibold text-foreground">No Logs Found</h3>
                <p className="text-sm text-muted-foreground max-w-xs mt-1">
                  Try adjusting search parameters or selection filters to display ledger data.
                </p>
              </div>
            ) : (
              <div className="w-full overflow-x-auto">
                <div className="min-w-[1100px] flex flex-col">
                  {/* Header */}
                  <div className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border bg-muted/30 py-3 px-4 text-sm font-semibold text-muted-foreground">
                    <div>Timestamp</div>
                    <div>Actor</div>
                    <div>Action</div>
                    <div>Entity</div>
                    <div>Description</div>
                    <div>Origin IP</div>
                    <div className="text-center">Data</div>
                  </div>

                  {/* Scrollable Container */}
                  <div
                    ref={parentRef}
                    className="overflow-y-auto max-h-[600px] relative w-full"
                  >
                    <div style={{ height: `${totalSize}px`, position: "relative" }} className="w-full">
                      {virtualRows.map((virtualRow) => {
                        const isLoaderRow = virtualRow.index > allRows.length - 1;
                        const log = allRows[virtualRow.index];

                        return (
                          <div
                            key={virtualRow.key}
                            data-index={virtualRow.index}
                            ref={rowVirtualizer.measureElement}
                            style={{
                              position: "absolute",
                              top: 0,
                              left: 0,
                              width: "100%",
                              transform: `translateY(${virtualRow.start}px)`,
                            }}
                            className="grid grid-cols-[180px_200px_160px_180px_1fr_160px_80px] items-center border-b border-border/40 hover:bg-muted/10 transition-colors py-3 px-4 min-h-[64px]"
                          >
                            {isLoaderRow ? (
                              isFetchingNextPage ? (
                                <>
                                  <div className="pr-2">
                                    <Skeleton className="h-4 w-28" />
                                  </div>
                                  <div className="pr-2 flex items-center gap-2">
                                    <Skeleton className="h-6 w-6 rounded-full" />
                                    <div className="space-y-1 flex-1">
                                      <Skeleton className="h-3 w-20" />
                                      <Skeleton className="h-2 w-28" />
                                    </div>
                                  </div>
                                  <div className="pr-2">
                                    <Skeleton className="h-5 w-24 rounded-full" />
                                  </div>
                                  <div className="pr-2 space-y-1">
                                    <Skeleton className="h-2 w-12" />
                                    <Skeleton className="h-3 w-16" />
                                  </div>
                                  <div className="pr-2">
                                    <Skeleton className="h-4 w-full max-w-[200px]" />
                                  </div>
                                  <div className="pr-2 space-y-1">
                                    <Skeleton className="h-3 w-16" />
                                    <Skeleton className="h-2 w-20" />
                                  </div>
                                  <div className="flex justify-center">
                                    <Skeleton className="h-8 w-8 rounded-md" />
                                  </div>
                                </>
                              ) : (
                                <div className="col-span-7 text-center py-4 text-sm text-muted-foreground w-full">
                                  No more logs to load
                                </div>
                              )
                            ) : (
                              <>
                                <div className="text-xs font-mono text-muted-foreground pr-2">
                                  {format(new Date(log.createdAt), "yyyy-MM-dd hh:mm a")}
                                </div>
                                <div className="pr-2">
                                  <div className="flex items-center gap-2 min-w-0">
                                    <Avatar className="h-6 w-6 shrink-0 border border-border">
                                      <AvatarImage src={log.user.image || ""} />
                                      <AvatarFallback className="text-2xs bg-muted font-bold text-foreground">
                                        {log.user.name.charAt(0).toUpperCase()}
                                      </AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col min-w-0">
                                      <span className="text-sm font-medium truncate text-foreground">
                                        {log.user.name}
                                      </span>
                                      <span className="text-2xs text-muted-foreground truncate">
                                        {log.user.email}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="pr-2">
                                  <Badge variant={getActionBadgeVariant(log.action)} className="text-2xs px-2 py-0.5">
                                    {log.action}
                                  </Badge>
                                </div>
                                <div className="pr-2">
                                  <div className="flex flex-col min-w-0">
                                    <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                                      {log.entityType}
                                    </span>
                                    <span className="text-xs font-mono font-medium text-foreground truncate max-w-[150px]">
                                      {log.entityName || log.entityId || "N/A"}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-sm text-foreground max-w-xs break-words font-medium pr-2">
                                  {log.description}
                                </div>
                                <div className="pr-2">
                                  <div className="flex flex-col text-xs space-y-0.5 text-muted-foreground">
                                    <span className="flex items-center gap-1">
                                      <Globe className="h-3 w-3 shrink-0" />
                                      {log.ipAddress || "Unknown"}
                                    </span>
                                    <span className="flex items-center gap-1 font-medium text-2xs">
                                      <Laptop className="h-3 w-3 shrink-0" />
                                      {formatBrowser(log.userAgent)}
                                    </span>
                                  </div>
                                </div>
                                <div className="text-center">
                                  {log.metadata ? (
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => setSelectedMetadata(log.metadata)}
                                      className="h-8 w-8 hover:bg-muted text-primary hover:text-primary-foreground"
                                    >
                                      <Database className="h-4 w-4" />
                                    </Button>
                                  ) : (
                                    <span className="text-xs text-muted-foreground font-mono">—</span>
                                  )}
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* JSON Metadata View Dialog */}
      <Dialog open={selectedMetadata !== null} onOpenChange={() => setSelectedMetadata(null)}>
        <DialogContent className="max-w-md border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <CheckSquare className="h-5 w-5 text-primary" /> Event Payload Metadata
            </DialogTitle>
            <DialogDescription className="text-xs">
              Direct state attributes captured when the action was logged.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-muted p-4 rounded-lg overflow-x-auto max-h-96 border border-border/50">
            <pre className="text-xs font-mono text-foreground leading-relaxed whitespace-pre-wrap">
              {JSON.stringify(selectedMetadata, null, 2)}
            </pre>
          </div>
          <div className="flex justify-end pt-2">
            <Button size="sm" onClick={() => setSelectedMetadata(null)}>
              Close View
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
