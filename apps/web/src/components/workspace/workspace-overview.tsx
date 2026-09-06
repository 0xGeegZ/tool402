import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";

export function WorkspaceOverview() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Preview boundary</CardTitle>
        <CardDescription>Future workspace capabilities require their own local contract.</CardDescription>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        Use the route map to inspect the currently committed local surfaces.
      </CardContent>
    </Card>
  );
}
