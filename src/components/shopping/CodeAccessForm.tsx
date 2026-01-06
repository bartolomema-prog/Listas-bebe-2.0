import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

export function CodeAccessForm() {
  const [code, setCode] = useState('');
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedCode = code.trim().toUpperCase();
    if (trimmedCode) {
      navigate(`/lista/${trimmedCode}`);
    }
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">¿Tienes un código de lista?</CardTitle>
        <CardDescription>
          Introduce el código para ver una lista compartida
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            placeholder="Ej: ABC123"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            maxLength={6}
            className="uppercase font-mono tracking-wider"
          />
          <Button type="submit" disabled={!code.trim()}>
            <Search className="h-4 w-4 mr-2" />
            Ver
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
