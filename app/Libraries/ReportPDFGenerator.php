<?php

namespace App\Libraries;

use Mpdf\Mpdf;
use Exception;

class ReportPDFGenerator
{
    protected $mpdf;
    protected $config;

    public function __construct()
    {
        $this->config = [
            'mode' => 'utf-8',
            'format' => 'A4',
            'default_font_size' => 11,
            'default_font' => 'dejavusans',
            'margin_left' => 15,
            'margin_right' => 15,
            'margin_top' => 16,
            'margin_bottom' => 16,
            'margin_header' => 9,
            'margin_footer' => 9,
            'orientation' => 'P',
            'tempDir' => WRITEPATH . 'cache'
        ];
    }

    /**
     * Generate PDF from HTML content
     * 
     * @param string $html HTML content
     * @param string $filename Output filename
     * @param string $mode 'I' = inline, 'D' = download, 'F' = save to file, 'S' = return as string
     * @param string $destination Full path for mode 'F'
     * @return mixed
     */
    public function generateFromHTML($html, $filename = 'report.pdf', $mode = 'I', $destination = null)
    {
        try {
            // Initialize mPDF
            $this->mpdf = new Mpdf($this->config);
            
            // Set document properties
            $this->mpdf->SetTitle($filename);
            $this->mpdf->SetAuthor('Jubaland Police - Case Management System');
            $this->mpdf->SetCreator('PCMS Report Generator');
            
            // Write HTML to PDF
            $this->mpdf->WriteHTML($html);
            
            // Output based on mode
            if ($mode === 'F' && $destination) {
                // Save to file
                return $this->mpdf->Output($destination, $mode);
            } else {
                // Return or display
                return $this->mpdf->Output($filename, $mode);
            }
            
        } catch (Exception $e) {
            log_message('error', 'PDF Generation Error: ' . $e->getMessage());
            throw new Exception('Failed to generate PDF: ' . $e->getMessage());
        }
    }

    /**
     * Generate PDF and save to public directory
     * 
     * @param string $html HTML content
     * @param string $filename Filename without path
     * @param string $subfolder Subfolder within public/uploads/reports/
     * @return string Full path to saved file
     */
    public function saveToPublic($html, $filename, $subfolder = '')
    {
        try {
            // Create directory if doesn't exist
            $basePath = FCPATH . 'uploads/reports/';
            if ($subfolder) {
                $basePath .= rtrim($subfolder, '/') . '/';
            }
            
            if (!is_dir($basePath)) {
                mkdir($basePath, 0755, true);
            }
            
            // Full path for saving
            $fullPath = $basePath . $filename;
            
            // Generate and save PDF
            $this->generateFromHTML($html, $filename, 'F', $fullPath);
            
            // Return public URL
            return '/uploads/reports/' . ($subfolder ? $subfolder . '/' : '') . $filename;
            
        } catch (Exception $e) {
            log_message('error', 'PDF Save Error: ' . $e->getMessage());
            throw new Exception('Failed to save PDF: ' . $e->getMessage());
        }
    }

    /**
     * Delete old PDF file if exists
     * 
     * @param string $filename Filename to delete
     * @param string $subfolder Subfolder within public/uploads/reports/
     * @return bool
     */
    public function deleteOldPDF($filename, $subfolder = '')
    {
        try {
            $basePath = FCPATH . 'uploads/reports/';
            if ($subfolder) {
                $basePath .= rtrim($subfolder, '/') . '/';
            }
            
            $fullPath = $basePath . $filename;
            
            if (file_exists($fullPath)) {
                return unlink($fullPath);
            }
            
            return true;
            
        } catch (Exception $e) {
            log_message('error', 'PDF Delete Error: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Generate PDF for full case report
     * Replaces old PDF if exists
     * 
     * @param string $html HTML content
     * @param int $caseId Case ID
     * @param string $caseNumber Case number
     * @param string $language Report language
     * @return array Result with PDF URL and path
     */
    public function generateFullCaseReport($html, $caseId, $caseNumber, $language = 'en')
    {
        try {
            // Sanitize case number for filename
            $safeCaseNumber = preg_replace('/[^a-zA-Z0-9-_]/', '_', $caseNumber);
            
            // Create filename: full-report-CASE-001-en.pdf
            $filename = "full-report-{$safeCaseNumber}-{$language}.pdf";
            
            // Delete old PDF if exists
            $this->deleteOldPDF($filename, 'full-reports');
            
            // Generate and save new PDF
            $publicUrl = $this->saveToPublic($html, $filename, 'full-reports');
            
            return [
                'success' => true,
                'filename' => $filename,
                'url' => $publicUrl,
                'full_url' => base_url($publicUrl),
                'file_path' => FCPATH . 'uploads/reports/full-reports/' . $filename
            ];
            
        } catch (Exception $e) {
            log_message('error', 'Full Report PDF Generation Error: ' . $e->getMessage());
            return [
                'success' => false,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Get public URL for a saved PDF
     * 
     * @param string $filename Filename
     * @param string $subfolder Subfolder
     * @return string Full URL
     */
    public function getPDFUrl($filename, $subfolder = '')
    {
        $path = '/uploads/reports/' . ($subfolder ? $subfolder . '/' : '') . $filename;
        return base_url($path);
    }
}
