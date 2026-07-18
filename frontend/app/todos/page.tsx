import { AlertCircle, CheckCircle2, ListTodo } from "lucide-react"
import { cookies } from "next/headers"

import { Header } from "@/components/shared/Header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { createClient } from "@/utils/supabase/server"

interface Todo {
  id: string | number
  name: string
}

export default async function TodosPage() {
  const cookieStore = await cookies()
  const supabase = createClient(cookieStore)
  const { data, error } = await supabase
    .from("todos")
    .select("id,name")
    .order("id")
  const todos = (data ?? []) as Todo[]

  return (
    <div className="min-h-screen bg-muted/20">
      <Header context="Supabase todos" />
      <main className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-8 flex items-center gap-3">
          <div className="flex size-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <ListTodo className="size-5" />
          </div>
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Todos</h1>
            <p className="text-sm text-muted-foreground">
              Live data fetched from Supabase.
            </p>
          </div>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle />
            <AlertTitle>Todos are not initialized</AlertTitle>
            <AlertDescription>
              The Supabase connection is active, but the public.todos table is
              not available to this project yet.
            </AlertDescription>
          </Alert>
        ) : null}

        {!error && todos.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="py-14 text-center text-sm text-muted-foreground">
              No todos yet.
            </CardContent>
          </Card>
        ) : null}

        {!error && todos.length > 0 ? (
          <div className="grid gap-3">
            {todos.map((todo) => (
              <Card key={todo.id}>
                <CardHeader className="py-4">
                  <CardTitle className="flex items-center gap-3 text-base">
                    <CheckCircle2 className="size-4 text-emerald-600" />
                    {todo.name}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        ) : null}
      </main>
    </div>
  )
}
