import React, { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

export default function DebugSchemaPage() {
  const [schema, setSchema] = useState<any[]>([]);
  const [constraints, setConstraints] = useState<any[]>([]);
  const [sampleData, setSampleData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        // Get schema from information_schema
        const { data: schemaData, error: schemaError } = await supabase.rpc('get_table_schema', {
          table_name: 'budgets'
        });

        if (schemaError) {
          // Fallback: Try direct query
          const { data: directSchema, error: directError } = await supabase
            .from('budgets')
            .select('*')
            .limit(1);

          if (directError) {
            setError(`Schema query failed: ${directError.message}`);
          } else if (directSchema && directSchema.length > 0) {
            const columns = Object.keys(directSchema[0]).map(key => ({
              column_name: key,
              data_type: typeof directSchema[0][key],
              is_nullable: 'unknown',
              column_default: 'unknown'
            }));
            setSchema(columns);
            setSampleData(directSchema);
          } else {
            // No data, try to insert a test row to see what columns are required
            setError('No existing data. Attempting insert to discover required columns...');
            const { error: insertError } = await supabase
              .from('budgets')
              .insert({});

            if (insertError) {
              setError(`Insert failed (this helps us see required columns): ${insertError.message}`);
            }
          }
        } else {
          setSchema(schemaData);
        }

        // Get sample data
        const { data: samples, error: sampleError } = await supabase
          .from('budgets')
          .select('*')
          .limit(5);

        if (!sampleError && samples) {
          setSampleData(samples);
        }

      } catch (err: any) {
        setError(err.message);
      }
    })();
  }, []);

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold text-white">Budgets Table Schema Debug</h1>

      {error && (
        <div className="bg-red-500/20 border border-red-500 rounded-lg p-4">
          <h3 className="font-semibold text-red-400 mb-2">Error Info:</h3>
          <pre className="text-sm text-white whitespace-pre-wrap">{error}</pre>
        </div>
      )}

      {schema.length > 0 && (
        <div className="bg-blue-500/20 border border-blue-500 rounded-lg p-4">
          <h3 className="font-semibold text-blue-400 mb-3">Table Schema:</h3>
          <table className="w-full text-sm text-white">
            <thead>
              <tr className="border-b border-blue-500/50">
                <th className="text-left py-2">Column Name</th>
                <th className="text-left py-2">Data Type</th>
                <th className="text-left py-2">Nullable</th>
                <th className="text-left py-2">Default</th>
              </tr>
            </thead>
            <tbody>
              {schema.map((col: any, i: number) => (
                <tr key={i} className="border-b border-blue-500/20">
                  <td className="py-2 font-mono font-bold">{col.column_name}</td>
                  <td className="py-2 font-mono">{col.data_type}</td>
                  <td className="py-2">{col.is_nullable}</td>
                  <td className="py-2 font-mono text-xs">{col.column_default || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {sampleData.length > 0 && (
        <div className="bg-green-500/20 border border-green-500 rounded-lg p-4">
          <h3 className="font-semibold text-green-400 mb-3">Sample Data:</h3>
          <pre className="text-sm text-white overflow-auto">
            {JSON.stringify(sampleData, null, 2)}
          </pre>
        </div>
      )}

      <div className="bg-yellow-500/20 border border-yellow-500 rounded-lg p-4">
        <h3 className="font-semibold text-yellow-400 mb-3">Instructions:</h3>
        <p className="text-white text-sm">
          This page shows the ACTUAL database schema. Copy this information and paste it back to Claude.
          <br /><br />
          If the schema doesn't show up, the error message will tell us what columns are missing/required.
        </p>
      </div>
    </div>
  );
}
