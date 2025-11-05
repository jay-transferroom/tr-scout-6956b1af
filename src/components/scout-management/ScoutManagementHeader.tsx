
interface ScoutManagementHeaderProps {}

const ScoutManagementHeader = ({}: ScoutManagementHeaderProps) => {
  return (
    <div className="mb-6 md:mb-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold">Scout Management</h1>
          <p className="text-muted-foreground mt-2 text-sm md:text-base">
            Assign scouts to players and track scouting progress across your team.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ScoutManagementHeader;
