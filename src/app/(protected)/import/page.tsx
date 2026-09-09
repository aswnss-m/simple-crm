import {
  UploadCloud,
  FileSpreadsheet,
  FileText,
  CheckCircle2,
  AlertCircle,
  Download,
  ArrowRight,
  Clock3,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { PageHeader } from "@/components/page-header"

export default function ImportPage() {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 ">

      {/* Header */}
      <PageHeader
        title="Import contacts"
        description="Import contacts from a CSV file."
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">

        {/* Main upload area */}
        <Card>
          <CardHeader>
            <CardTitle>Upload your file</CardTitle>
            <CardDescription>
              Select a CSV file containing the contacts you want to import.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="group flex min-h-70 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-muted-foreground/20 bg-muted/20 px-6 text-center transition-colors hover:border-primary/40 hover:bg-muted/40">

              <div className="mb-5 flex size-14 items-center justify-center rounded-xl border bg-background shadow-sm">
                <UploadCloud className="size-6 text-muted-foreground" />
              </div>

              <h3 className="font-medium">
                Drop your CSV file here
              </h3>

              <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                Drag and drop your file here, or choose a file from your
                computer.
              </p>

              <Button className="mt-5">
                Choose file
              </Button>

              <p className="mt-3 text-xs text-muted-foreground">
                CSV up to 10 MB
              </p>
            </div>

            <div className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex gap-3">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Download className="size-4 text-muted-foreground" />
                </div>

                <div>
                  <p className="text-sm font-medium">
                    Need a template?
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Download our sample CSV to see the recommended format.
                  </p>
                </div>
              </div>

              <Button variant="outline" size="sm">
                Download template
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Requirements */}
        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">
              File requirements
            </CardTitle>
            <CardDescription>
              Make sure your file follows these guidelines.
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-5">

            <Requirement
              icon={<FileText className="size-4" />}
              title="CSV format"
              description="Your file must use the .csv format."
            />

            <Requirement
              icon={<CheckCircle2 className="size-4" />}
              title="Column headers"
              description="The first row should contain field names."
            />

            <Requirement
              icon={<CheckCircle2 className="size-4" />}
              title="Email recommended"
              description="Include email addresses to identify contacts."
            />

            <Requirement
              icon={<AlertCircle className="size-4" />}
              title="Maximum file size"
              description="Files must be smaller than 10 MB."
            />

            <Separator />

            <div className="space-y-3">
              <p className="text-sm font-medium">
                Example columns
              </p>

              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">First Name</Badge>
                <Badge variant="secondary">Last Name</Badge>
                <Badge variant="secondary">Email</Badge>
                <Badge variant="secondary">Phone</Badge>
                <Badge variant="secondary">Company</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Import flow */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            How importing works
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">

            <Step
              number="01"
              title="Upload"
              description="Choose the CSV file containing your contacts."
            />

            <Step
              number="02"
              title="Map fields"
              description="Match your CSV columns with CRM contact fields."
            />

            <Step
              number="03"
              title="Import"
              description="Review your data and start the import."
            />

          </div>
        </CardContent>
      </Card>

      {/* Recent imports */}
      <Card>
        <CardHeader className="flex-row items-center justify-between space-y-0">
          <div>
            <CardTitle className="text-base">
              Recent imports
            </CardTitle>
            <CardDescription>
              Your latest contact import activity.
            </CardDescription>
          </div>

          <Clock3 className="size-4 text-muted-foreground" />
        </CardHeader>

        <CardContent>
          <div className="flex min-h-30 flex-col items-center justify-center rounded-lg border border-dashed text-center">

            <FileSpreadsheet className="mb-3 size-6 text-muted-foreground" />

            <p className="text-sm font-medium">
              No imports yet
            </p>

            <p className="mt-1 text-xs text-muted-foreground">
              Your completed imports will appear here.
            </p>

          </div>
        </CardContent>
      </Card>

    </div>
  )
}

function Requirement({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex gap-3">
      <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
        {icon}
      </div>

      <div>
        <p className="text-sm font-medium">
          {title}
        </p>

        <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  )
}

function Step({
  number,
  title,
  description,
}: {
  number: string
  title: string
  description: string
}) {
  return (
    <div className="relative rounded-lg border p-5">
      <span className="text-xs font-medium text-muted-foreground">
        {number}
      </span>

      <div className="mt-4 flex items-center justify-between">
        <h3 className="font-medium">
          {title}
        </h3>

        <ArrowRight className="size-4 text-muted-foreground" />
      </div>

      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  )
}
