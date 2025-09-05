
import React, { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from '@/components/ui/sonner';
import { Upload, Package, X } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentImageUrl: string;
  onImageUpdate: (imageUrl: string) => void;
  productName: string;
}

const ImageUploadModal = ({ isOpen, onClose, currentImageUrl, onImageUpdate, productName }: ImageUploadModalProps) => {
  const [imageUrl, setImageUrl] = useState(currentImageUrl);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setImageUrl(e.target.value);
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast.error('Por favor, selecione apenas arquivos de imagem');
      return;
    }

    // Validar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('A imagem deve ter no máximo 5MB');
      return;
    }

    setIsUploading(true);
    try {
      // Converter arquivo para base64 para simular upload
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        setImageUrl(result);
        setIsUploading(false);
        toast.success('Imagem carregada com sucesso!');
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Erro ao fazer upload da imagem:', error);
      toast.error('Erro ao fazer upload da imagem');
      setIsUploading(false);
    }
  };

  const handleSave = () => {
    onImageUpdate(imageUrl);
    onClose();
    toast.success('Foto do produto atualizada!');
  };

  const handleRemoveImage = () => {
    setImageUrl('');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Editar Foto do Produto</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Preview da imagem */}
          <div className="flex justify-center">
            <div className="relative">
              <Avatar className="h-32 w-32">
                <AvatarImage 
                  src={imageUrl} 
                  alt={productName}
                  className="object-cover"
                />
                <AvatarFallback className="bg-gray-100">
                  <Package className="h-12 w-12 text-gray-400" />
                </AvatarFallback>
              </Avatar>
              {imageUrl && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                  onClick={handleRemoveImage}
                >
                  <X className="h-3 w-3" />
                </Button>
              )}
            </div>
          </div>

          {/* Upload de arquivo */}
          <div className="space-y-2">
            <Label>Fazer upload de arquivo</Label>
            <div className="flex gap-2">
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                <Upload className="h-4 w-4 mr-2" />
                {isUploading ? 'Carregando...' : 'Escolher'}
              </Button>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">Ou</span>
            </div>
          </div>

          {/* URL da imagem */}
          <div className="space-y-2">
            <Label htmlFor="imageUrl">URL da imagem</Label>
            <Input
              id="imageUrl"
              value={imageUrl}
              onChange={handleImageUrlChange}
              placeholder="https://exemplo.com/imagem.jpg"
            />
          </div>

          {/* Botões de ação */}
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={handleSave}>
              Salvar Foto
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageUploadModal;
