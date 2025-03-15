
import React from 'react';
import { format } from 'date-fns';
import { CheckCircle, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { ScraperLog, ScraperSourceDetail } from '@/types/scraper';

interface ScraperLogsProps {
  scraperLogs: ScraperLog[];
  isLoadingLogs: boolean;
}

const ScraperLogs: React.FC<ScraperLogsProps> = ({
  scraperLogs,
  isLoadingLogs
}) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Scraper Logs</CardTitle>
        <CardDescription>
          View history of web scraper runs
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Timestamp</TableHead>
                <TableHead>Sources</TableHead>
                <TableHead>Events Found</TableHead>
                <TableHead>New Events</TableHead>
                <TableHead>Failures</TableHead>
                <TableHead>Details</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoadingLogs ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Loading logs...
                  </TableCell>
                </TableRow>
              ) : scraperLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No scraper logs found. Run the scraper to generate logs.
                  </TableCell>
                </TableRow>
              ) : (
                scraperLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell>
                      {format(new Date(log.created_at), 'MMM d, yyyy HH:mm:ss')}
                    </TableCell>
                    <TableCell>
                      {log.sources_processed}
                    </TableCell>
                    <TableCell>
                      {log.total_events_found}
                    </TableCell>
                    <TableCell>
                      <span className="text-green-600 font-medium">
                        {log.new_events_added}
                      </span>
                    </TableCell>
                    <TableCell>
                      {log.failures > 0 ? (
                        <Badge variant="destructive">{log.failures}</Badge>
                      ) : (
                        <Badge variant="outline">0</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-3xl">
                          <DialogHeader>
                            <DialogTitle>Scraper Log Details</DialogTitle>
                            <DialogDescription>
                              Run at {format(new Date(log.created_at), 'MMMM d, yyyy HH:mm:ss')}
                            </DialogDescription>
                          </DialogHeader>
                          
                          <div className="max-h-[60vh] overflow-y-auto space-y-4">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div className="bg-muted p-4 rounded">
                                <div className="text-sm text-muted-foreground">
                                  Sources Processed
                                </div>
                                <div className="text-2xl font-bold">
                                  {log.sources_processed}
                                </div>
                              </div>
                              <div className="bg-muted p-4 rounded">
                                <div className="text-sm text-muted-foreground">
                                  Events Found
                                </div>
                                <div className="text-2xl font-bold">
                                  {log.total_events_found}
                                </div>
                              </div>
                              <div className="bg-muted p-4 rounded">
                                <div className="text-sm text-muted-foreground">
                                  New Events Added
                                </div>
                                <div className="text-2xl font-bold text-green-600">
                                  {log.new_events_added}
                                </div>
                              </div>
                              <div className="bg-muted p-4 rounded">
                                <div className="text-sm text-muted-foreground">
                                  Failures
                                </div>
                                <div className="text-2xl font-bold text-red-500">
                                  {log.failures}
                                </div>
                              </div>
                            </div>
                            
                            <Separator />
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Source Details</h4>
                              <div className="space-y-3">
                                {log.details.map((detail: ScraperSourceDetail, index: number) => (
                                  <div key={index} className="border rounded-md p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="font-medium">{detail.sourceName}</div>
                                      <Badge 
                                        variant={detail.status === 'success' ? 'default' : 'destructive'}
                                      >
                                        {detail.status}
                                      </Badge>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                      <div>
                                        <div className="text-muted-foreground">Events Found</div>
                                        <div>{detail.eventsFound}</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">New Events</div>
                                        <div className="text-green-600">{detail.newEvents}</div>
                                      </div>
                                      <div>
                                        <div className="text-muted-foreground">Duplicates</div>
                                        <div>{detail.existingEvents}</div>
                                      </div>
                                    </div>
                                    {detail.error && (
                                      <div className="mt-2 text-xs text-red-500">
                                        Error: {detail.error}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </DialogContent>
                      </Dialog>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default ScraperLogs;
