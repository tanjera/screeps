using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Data;
using System.Drawing;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Forms;
using System.IO;

namespace csv_to_coords
{
    public partial class Main : Form
    {
        public Main()
        {
            InitializeComponent();
        }

        private void btnBrowse_Click(object sender, EventArgs e)
        {
            OpenFileDialog openFileDialog1 = new OpenFileDialog();

            openFileDialog1.InitialDirectory = "c:\\";
            openFileDialog1.Filter = "CSV Files (*.csv)|*.csv|All files (*.*)|*.*";
            openFileDialog1.FilterIndex = 1;
            openFileDialog1.RestoreDirectory = true;

            if (openFileDialog1.ShowDialog() == DialogResult.OK)
            {
                txtFilePath.Text = openFileDialog1.FileName;
            }
        }

        private void btnGenerate_Click(object sender, EventArgs e)
        {
            StreamReader inFile = new StreamReader(txtFilePath.Text);
           
            for (int y = 0; !inFile.EndOfStream; y++)
            {
                string inRaw = inFile.ReadLine();
                string[] inArray = inRaw.Split(',');
            }
        }
    }
}
