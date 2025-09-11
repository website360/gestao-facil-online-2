import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, FileImage, FileText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PaymentReceiptsUploadProps {
  onFilesChange: (files: FileWithPreview[]) => void;
  clientName: string;
  disabled?: boolean;
}

interface FileWithPreview {
  file: File;
  preview: string;
  generatedName: string;
}

const PaymentReceiptsUpload = ({ onFilesChange, clientName, disabled }: PaymentReceiptsUploadProps) => {
  const [selectedFiles, setSelectedFiles] = useState<FileWithPreview[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  const generateFileName = (originalFile: File, index: number): string => {
    // Limpar nome do cliente (remover caracteres especiais e espaços)
    const cleanClientName = clientName
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-zA-Z0-9]/g, '') // Remove caracteres especiais
      .toLowerCase();
    
    const fileExtension = originalFile.name.split('.').pop();
    return `${cleanClientName}-C${index + 1}.${fileExtension}`;
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    // Validar arquivos
    const validFiles: FileWithPreview[] = [];
    
    files.forEach((file, index) => {
      // Verificar tipo
      if (!acceptedTypes.includes(file.type)) {
        toast.error(`Arquivo ${file.name} não é suportado. Use JPG, JPEG, PNG ou PDF.`);
        return;
      }
      
      // Verificar tamanho
      if (file.size > maxFileSize) {
        toast.error(`Arquivo ${file.name} é muito grande. Máximo 10MB.`);
        return;
      }
      
      // Gerar nome automático
      const generatedName = generateFileName(file, selectedFiles.length + validFiles.length);
      
      // Criar preview para imagens
      let preview = '';
      if (file.type.startsWith('image/')) {
        preview = URL.createObjectURL(file);
      }
      
      validFiles.push({
        file,
        preview,
        generatedName
      });
    });
    
    if (validFiles.length > 0) {
      const newFiles = [...selectedFiles, ...validFiles];
      setSelectedFiles(newFiles);
      onFilesChange(newFiles);
      toast.success(`${validFiles.length} arquivo(s) adicionado(s)`);
    }
    
    // Limpar input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeFile = (index: number) => {
    const newFiles = selectedFiles.filter((_, i) => i !== index);
    // Regenerar nomes para manter sequência
    const updatedFiles = newFiles.map((fileData, i) => ({
      ...fileData,
      generatedName: generateFileName(fileData.file, i)
    }));
    
    setSelectedFiles(updatedFiles);
    onFilesChange(updatedFiles);
    
    // Limpar preview se necessário
    const removedFile = selectedFiles[index];
    if (removedFile.preview) {
      URL.revokeObjectURL(removedFile.preview);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType === 'application/pdf') {
      return <FileText className="w-8 h-8 text-red-500" />;
    }
    return <FileImage className="w-8 h-8 text-blue-500" />;
  };

  return (
    <div className="space-y-4">
      <div>
        <Label>Comprovantes de Pagamento *</Label>
        <p className="text-sm text-muted-foreground mt-1">
          Adicione um ou mais comprovantes de pagamento (JPG, JPEG, PNG, PDF - máx. 10MB)
        </p>
      </div>

      {/* Upload área */}
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileSelect}
          className="hidden"
          disabled={disabled || uploading}
        />
        
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-2">
          Clique aqui ou arraste os arquivos para fazer upload
        </p>
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || uploading}
        >
          Selecionar Arquivos
        </Button>
      </div>

      {/* Arquivos selecionados */}
      {selectedFiles.length > 0 && (
        <div className="space-y-2">
          <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
          
          <div className="grid gap-2 max-h-60 overflow-y-auto">
            {selectedFiles.map((fileData, index) => (
              <Card key={index} className="p-3">
                <CardContent className="p-0">
                  <div className="flex items-center gap-3">
                    <div className="flex-shrink-0">
                      {fileData.preview ? (
                        <img
                          src={fileData.preview}
                          alt="Preview"
                          className="w-12 h-12 object-cover rounded"
                        />
                      ) : (
                        getFileIcon(fileData.file.type)
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">
                        {fileData.generatedName}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        Original: {fileData.file.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {(fileData.file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                    
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={disabled || uploading}
                      className="flex-shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {selectedFiles.length === 0 && (
        <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-3 rounded-lg">
          <AlertCircle className="w-5 h-5" />
          <span className="text-sm">
            Pelo menos um comprovante de pagamento é obrigatório para converter o orçamento em venda.
          </span>
        </div>
      )}
    </div>
  );
};

export default PaymentReceiptsUpload;