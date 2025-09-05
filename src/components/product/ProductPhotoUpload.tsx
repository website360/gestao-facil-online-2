import React from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Upload, Package, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface ProductPhotoUploadProps {
  photoUrl: string;
  setPhotoUrl?: (value: string) => void;
  readOnly?: boolean;
}

const ProductPhotoUpload = ({ photoUrl, setPhotoUrl, readOnly = false }: ProductPhotoUploadProps) => {
  const handlePhotoUpload = async () => {
    if (!setPhotoUrl || readOnly) return;
    
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        // Validar tamanho (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
          toast.error('A imagem deve ter no máximo 5MB');
          return;
        }

        try {
          // Gerar nome único para o arquivo
          const fileExt = file.name.split('.').pop();
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
          const filePath = `products/${fileName}`;

          console.log('Uploading file:', filePath);

          // Upload para o Supabase Storage
          const { data, error } = await supabase.storage
            .from('logos')
            .upload(filePath, file);

          if (error) {
            console.error('Upload error:', error);
            toast.error('Erro ao fazer upload da imagem');
            return;
          }

          // Obter URL pública da imagem
          const { data: publicUrlData } = supabase.storage
            .from('logos')
            .getPublicUrl(filePath);

          const publicUrl = publicUrlData.publicUrl;
          console.log('Image uploaded successfully, URL:', publicUrl);
          
          setPhotoUrl(publicUrl);
          toast.success('Foto adicionada com sucesso');
        } catch (error) {
          console.error('Error uploading image:', error);
          toast.error('Erro ao fazer upload da imagem');
        }
      }
    };
    input.click();
  };

  const handleRemovePhoto = async () => {
    if (!setPhotoUrl || readOnly) return;
    
    if (photoUrl) {
      try {
        // Extrair o caminho do arquivo da URL
        const urlParts = photoUrl.split('/');
        const fileName = urlParts[urlParts.length - 1];
        const filePath = `products/${fileName}`;

        // Tentar remover do storage (não falha se não existir)
        await supabase.storage
          .from('logos')
          .remove([filePath]);

        console.log('File removed from storage:', filePath);
      } catch (error) {
        console.log('Could not remove file from storage (may not exist):', error);
      }
    }
    
    setPhotoUrl('');
    toast.success('Foto removida');
  };

  // Function to check if image loads successfully
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('Image failed to load:', photoUrl);
    // Don't automatically clear the URL to allow user to see the issue
  };

  const handleImageLoad = () => {
    console.log('Image loaded successfully:', photoUrl);
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Foto do Produto</h3>
      
      {readOnly ? (
        <div className="flex items-center justify-center">
          {photoUrl ? (
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden border-2 border-gray-200">
              <img 
                src={photoUrl} 
                alt="Produto" 
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          ) : (
            <div className="w-32 h-32 bg-gray-100 rounded-lg flex items-center justify-center border-2 border-gray-200">
              <Package className="h-12 w-12 text-gray-400" />
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center space-x-4">
          {photoUrl && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden">
              <img 
                src={photoUrl} 
                alt="Preview" 
                className="w-full h-full object-cover"
                onError={handleImageError}
                onLoad={handleImageLoad}
              />
            </div>
          )}
          {!photoUrl && (
            <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center">
              <Package className="h-8 w-8 text-gray-400" />
            </div>
          )}
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handlePhotoUpload}
              className="flex items-center gap-2"
            >
              <Upload className="h-4 w-4" />
              {photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
            </Button>
            {photoUrl && (
              <Button
                type="button"
                variant="outline"
                onClick={handleRemovePhoto}
                className="flex items-center gap-2 text-red-600 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
                Remover
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductPhotoUpload;
