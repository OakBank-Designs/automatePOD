export default function Dashboard() {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold">Dashboard</h2>
        {/* Example cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded shadow">Total Products: 0</div>
          <div className="bg-white p-4 rounded shadow">Designs Pending: 0</div>
          <div className="bg-white p-4 rounded shadow">Batches Completed: 0</div>
        </div>
        {/* More widgets… */}
      </div>
    )
  }