'use client'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'


type Log = {
  id: number
  action: string 
  created_at: string
}

export default function ActivityLogPage() {
  const [logs, setLogs] = useState<Log[]>([])
  const [newAction, setNewAction] = useState('')

  // Load logs when page starts
  useEffect(() => {
    fetchLogs()
  }, [])

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) console.error(error)
    else setLogs(data as Log[])
  }

  const addLog = async () => {
    if (!newAction) return
    const { error } = await supabase
      .from('activity_logs')
      .insert([{ action: newAction }])

    if (error) console.error(error)
    else {
      setNewAction('')
      fetchLogs()
    }
  }

  const deleteLog = async (id: number) => {
    const { error } = await supabase
      .from('activity_logs')
      .delete()
      .eq('id', id)

    if (error) console.error(error)
    else fetchLogs()
  }

  return (
    <div className="max-w-md mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">📜 Activity Log</h1>

      {/* Add new log */}
      <div className="flex mb-4">
        <input
          type="text"
          value={newAction}
          onChange={(e) => setNewAction(e.target.value)}
          placeholder="Enter activity..."
          className="flex-1 border p-2 rounded-l"
        />
        <button
          onClick={addLog}
          className="bg-black-300 text-white px-5 rounded-r"
        >
          Add
        </button>
      </div>

      {/* Show logs */}
      <ul className="space-y-2">
        {logs.map((log) => (
          <li
            key={log.id}
            className="flex justify-between items-center border p-2 rounded"
          >
            <div>
              <p className="font-medium">{log.action}</p>
              <p className="text-xs text-gray-500">
                {new Date(log.created_at).toLocaleString()}
              </p>
            </div>
            <button
              onClick={() => deleteLog(log.id)}
              className="text-red-500 hover:underline text-sm"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
