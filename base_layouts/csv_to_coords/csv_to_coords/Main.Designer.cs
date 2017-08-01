namespace csv_to_coords
{
    partial class Main
    {
        /// <summary>
        /// Required designer variable.
        /// </summary>
        private System.ComponentModel.IContainer components = null;

        /// <summary>
        /// Clean up any resources being used.
        /// </summary>
        /// <param name="disposing">true if managed resources should be disposed; otherwise, false.</param>
        protected override void Dispose(bool disposing)
        {
            if (disposing && (components != null))
            {
                components.Dispose();
            }
            base.Dispose(disposing);
        }

        #region Windows Form Designer generated code

        /// <summary>
        /// Required method for Designer support - do not modify
        /// the contents of this method with the code editor.
        /// </summary>
        private void InitializeComponent()
        {
            this.txtFilePath = new System.Windows.Forms.TextBox();
            this.label1 = new System.Windows.Forms.Label();
            this.btnBrowse = new System.Windows.Forms.Button();
            this.label2 = new System.Windows.Forms.Label();
            this.numOffsetX = new System.Windows.Forms.NumericUpDown();
            this.numOffsetY = new System.Windows.Forms.NumericUpDown();
            this.label3 = new System.Windows.Forms.Label();
            this.txtOutput = new System.Windows.Forms.TextBox();
            this.btnGenerate = new System.Windows.Forms.Button();
            ((System.ComponentModel.ISupportInitialize)(this.numOffsetX)).BeginInit();
            ((System.ComponentModel.ISupportInitialize)(this.numOffsetY)).BeginInit();
            this.SuspendLayout();
            // 
            // txtFilePath
            // 
            this.txtFilePath.Location = new System.Drawing.Point(71, 24);
            this.txtFilePath.Name = "txtFilePath";
            this.txtFilePath.Size = new System.Drawing.Size(293, 20);
            this.txtFilePath.TabIndex = 0;
            // 
            // label1
            // 
            this.label1.AutoSize = true;
            this.label1.Location = new System.Drawing.Point(15, 27);
            this.label1.Name = "label1";
            this.label1.Size = new System.Drawing.Size(50, 13);
            this.label1.TabIndex = 1;
            this.label1.Text = "CSV File:";
            // 
            // btnBrowse
            // 
            this.btnBrowse.Location = new System.Drawing.Point(370, 23);
            this.btnBrowse.Name = "btnBrowse";
            this.btnBrowse.Size = new System.Drawing.Size(71, 21);
            this.btnBrowse.TabIndex = 2;
            this.btnBrowse.Text = "Browse";
            this.btnBrowse.UseVisualStyleBackColor = true;
            this.btnBrowse.Click += new System.EventHandler(this.btnBrowse_Click);
            // 
            // label2
            // 
            this.label2.AutoSize = true;
            this.label2.Location = new System.Drawing.Point(15, 53);
            this.label2.Name = "label2";
            this.label2.Size = new System.Drawing.Size(48, 13);
            this.label2.TabIndex = 4;
            this.label2.Text = "Offset X:";
            // 
            // numOffsetX
            // 
            this.numOffsetX.Location = new System.Drawing.Point(70, 51);
            this.numOffsetX.Minimum = new decimal(new int[] {
            100,
            0,
            0,
            -2147483648});
            this.numOffsetX.Name = "numOffsetX";
            this.numOffsetX.Size = new System.Drawing.Size(49, 20);
            this.numOffsetX.TabIndex = 5;
            // 
            // numOffsetY
            // 
            this.numOffsetY.Location = new System.Drawing.Point(191, 51);
            this.numOffsetY.Minimum = new decimal(new int[] {
            100,
            0,
            0,
            -2147483648});
            this.numOffsetY.Name = "numOffsetY";
            this.numOffsetY.Size = new System.Drawing.Size(49, 20);
            this.numOffsetY.TabIndex = 7;
            // 
            // label3
            // 
            this.label3.AutoSize = true;
            this.label3.Location = new System.Drawing.Point(136, 53);
            this.label3.Name = "label3";
            this.label3.Size = new System.Drawing.Size(48, 13);
            this.label3.TabIndex = 6;
            this.label3.Text = "Offset Y:";
            // 
            // txtOutput
            // 
            this.txtOutput.AcceptsReturn = true;
            this.txtOutput.AcceptsTab = true;
            this.txtOutput.Location = new System.Drawing.Point(19, 77);
            this.txtOutput.Multiline = true;
            this.txtOutput.Name = "txtOutput";
            this.txtOutput.ScrollBars = System.Windows.Forms.ScrollBars.Both;
            this.txtOutput.Size = new System.Drawing.Size(421, 301);
            this.txtOutput.TabIndex = 8;
            this.txtOutput.WordWrap = false;
            // 
            // btnGenerate
            // 
            this.btnGenerate.Location = new System.Drawing.Point(267, 50);
            this.btnGenerate.Name = "btnGenerate";
            this.btnGenerate.Size = new System.Drawing.Size(173, 21);
            this.btnGenerate.TabIndex = 9;
            this.btnGenerate.Text = "Generate";
            this.btnGenerate.UseVisualStyleBackColor = true;
            this.btnGenerate.Click += new System.EventHandler(this.btnGenerate_Click);
            // 
            // Main
            // 
            this.ClientSize = new System.Drawing.Size(457, 392);
            this.Controls.Add(this.btnGenerate);
            this.Controls.Add(this.txtOutput);
            this.Controls.Add(this.numOffsetY);
            this.Controls.Add(this.label3);
            this.Controls.Add(this.numOffsetX);
            this.Controls.Add(this.label2);
            this.Controls.Add(this.btnBrowse);
            this.Controls.Add(this.label1);
            this.Controls.Add(this.txtFilePath);
            this.Name = "Main";
            this.Text = "CSV To Coordinates";
            ((System.ComponentModel.ISupportInitialize)(this.numOffsetX)).EndInit();
            ((System.ComponentModel.ISupportInitialize)(this.numOffsetY)).EndInit();
            this.ResumeLayout(false);
            this.PerformLayout();

        }

        #endregion

        private System.Windows.Forms.TextBox txtFilePath;
        private System.Windows.Forms.Label label1;
        private System.Windows.Forms.Button btnBrowse;
        private System.Windows.Forms.Label label2;
        private System.Windows.Forms.NumericUpDown numOffsetX;
        private System.Windows.Forms.NumericUpDown numOffsetY;
        private System.Windows.Forms.Label label3;
        private System.Windows.Forms.TextBox txtOutput;
        private System.Windows.Forms.Button btnGenerate;
    }
}

