import ReportDataImport from '@/components/ReportDataImport';

const DataImportPage = () => {
  return (
    <div className="container mx-auto pt-8 pb-16 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Import Data</h1>
        <p className="text-muted-foreground">Import player and report data into the system</p>
      </div>
      <ReportDataImport />
    </div>
  );
};

export default DataImportPage;
