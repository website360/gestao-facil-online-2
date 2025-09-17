import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu';
import { Paperclip, Download, FileImage, FileText, Trash2 } from 'lucide-react';
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
}

const SaleAttachmentsDropdown = ({ saleId, className }: SaleAttachmentsDropdownProps) => {
  const [attachments, setAttachments] = useState<SaleAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const { isAdmin } = useUserProfile();

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

  if (loading) {
    return (
      <Button variant="ghost" size="sm" disabled className={className}>
        <Paperclip className="w-4 h-4" />
      </Button>
    );
  }

  if (attachments.length === 0) {
    return null; // Não mostrar o ícone se não há anexos
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={className} title="Comprovantes de pagamento">
          <Paperclip className="w-4 h-4" />
          <span className="ml-1 text-xs">({attachments.length})</span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-64">
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
              
              {isAdmin && (
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
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default SaleAttachmentsDropdown;