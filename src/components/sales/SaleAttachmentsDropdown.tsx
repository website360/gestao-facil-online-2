import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Paperclip, Download, FileImage, FileText, Trash2, Upload } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useUserProfile } from '@/hooks/useUserProfile';

interface SaleAttachment {
  id: string;
  original_filename: string;
  stored_filename: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface SaleAttachmentsDropdownProps {
  saleId: string;
  className?: string;
  saleStatus?: string;
}

const SaleAttachmentsDropdown = ({ saleId, className, saleStatus }: SaleAttachmentsDropdownProps) => {
  const [attachments, setAttachments] = useState<SaleAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const { isAdmin } = useUserProfile();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const acceptedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'application/pdf'];
  const maxFileSize = 10 * 1024 * 1024; // 10MB

  useEffect(() => {
    fetchAttachments();
  }, [saleId]);

  const fetchAttachments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('sale_attachments')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setAttachments(data || []);
    } catch (error) {
      console.error('Error fetching attachments:', error);
    } finally {
      setLoading(false);
    }
  };

  const downloadAttachment = async (attachment: SaleAttachment) => {
    try {
      setDownloading(attachment.id);
      
      const { data, error } = await supabase.storage
        .from('payment-receipts')
        .download(attachment.file_path);

      if (error) throw error;

      // Create blob URL and download
      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.stored_filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast.success('Comprovante baixado com sucesso!');
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast.error('Erro ao baixar comprovante');
    } finally {
      setDownloading(null);
    }
  };

  const deleteAttachment = async (attachment: SaleAttachment) => {
    try {
      setDeleting(attachment.id);
      
      // Delete file from storage
      const { error: storageError } = await supabase.storage
        .from('payment-receipts')
        .remove([attachment.file_path]);

      if (storageError) throw storageError;

      // Delete record from database
      const { error: dbError } = await supabase
        .from('sale_attachments')
        .delete()
        .eq('id', attachment.id);

      if (dbError) throw dbError;

      // Update local state
      setAttachments(prev => prev.filter(a => a.id !== attachment.id));
      
      toast.success('Comprovante excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting attachment:', error);
      toast.error('Erro ao excluir comprovante');
    } finally {
      setDeleting(null);
    }
  };

  const getFileIcon = (mimeType: string) => {
    if (mimeType === 'application/pdf') {
      return <FileText className="w-4 h-4 text-red-500" />;
    }
    return <FileImage className="w-4 h-4 text-blue-500" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const generateFileName = (originalFile: File): string => {
    const timestamp = new Date().toISOString().replace(/[-:.]/g, '').slice(0, -1);
    const extension = originalFile.name.split('.').pop()?.toLowerCase() || 'unknown';
    return `comprovante-${timestamp}.${extension}`;
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não suportado. Use JPG, JPEG, PNG ou PDF.');
      return;
    }

    // Validar tamanho
    if (file.size > maxFileSize) {
      toast.error('Arquivo muito grande. Máximo 10MB.');
      return;
    }

    try {
      setUploading(true);
      
      // Gerar nome único para o arquivo
      const storedFilename = generateFileName(file);
      const filePath = `${saleId}/${storedFilename}`;

      // Upload para o storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('payment-receipts')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Salvar referência no banco
      const { data: attachmentData, error: dbError } = await supabase
        .from('sale_attachments')
        .insert({
          sale_id: saleId,
          original_filename: file.name,
          stored_filename: storedFilename,
          file_path: filePath,
          file_size: file.size,
          mime_type: file.type
        })
        .select()
        .single();

      if (dbError) throw dbError;

      // Adicionar à lista local
      setAttachments(prev => [...prev, attachmentData]);
      
      toast.success('Comprovante adicionado com sucesso!');
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error('Erro ao fazer upload do comprovante');
    } finally {
      setUploading(false);
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Paperclip className="w-4 h-4" />
      </Button>
    );
  }

  // Se não há anexos e não permite upload (venda finalizada), não renderizar nada
  if (attachments.length === 0 && saleStatus === 'finalizada') {
    return null;
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} title="Comprovantes de pagamento">
          <Paperclip className="w-4 h-4" />
          {attachments.length > 0 && (
            <span className="ml-1 text-xs">({attachments.length})</span>
          )}
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
        {/* Input oculto para upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.pdf"
          onChange={handleFileUpload}
          className="hidden"
          disabled={uploading}
        />
        
        <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground border-b">
          Comprovantes de Pagamento
        </div>
        
        {attachments.map((attachment) => (
          <DropdownMenuItem
            key={attachment.id}
            className="flex items-center gap-2 p-3 focus:bg-muted"
            onSelect={(e) => e.preventDefault()} // Prevent dropdown from closing
          >
            <div className="flex-shrink-0">
              {getFileIcon(attachment.mime_type)}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {attachment.stored_filename}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(attachment.file_size)}
              </p>
            </div>
            
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadAttachment(attachment);
                }}
                disabled={downloading === attachment.id || deleting === attachment.id}
                className="h-7 w-7 p-0"
                title="Baixar comprovante"
              >
                {downloading === attachment.id ? (
                  <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-primary"></div>
                ) : (
                  <Download className="w-3 h-3" />
                )}
              </Button>
              
              {isAdmin && saleStatus !== 'finalizada' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteAttachment(attachment);
                  }}
                  disabled={downloading === attachment.id || deleting === attachment.id}
                  className="h-7 w-7 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="Excluir comprovante"
                >
                  {deleting === attachment.id ? (
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-destructive"></div>
                  ) : (
                    <Trash2 className="w-3 h-3" />
                  )}
                </Button>
              )}
            </div>
          </DropdownMenuItem>
        ))}
        
        {saleStatus !== 'finalizada' && (
          <>
            <DropdownMenuSeparator />
            
            <DropdownMenuItem
              onClick={(e) => {
                e.preventDefault();
                fileInputRef.current?.click();
              }}
              disabled={uploading}
              className="flex items-center gap-2 p-3 cursor-pointer"
            >
              <Upload className="w-4 h-4 text-primary" />
              <span className="font-medium text-primary">
                {uploading ? 'Fazendo upload...' : 'Adicionar Comprovante'}
              </span>
              {uploading && (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary ml-auto"></div>
              )}
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SaleAttachmentsDropdown;