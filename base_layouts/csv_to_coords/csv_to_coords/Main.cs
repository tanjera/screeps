using System;
using System.Collections;
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

            List<String> spawn = new List<String>(),
                extension = new List<String>(),
                link = new List<String>(),
                storage = new List<String>(),
                tower = new List<String>(),
                terminal = new List<String>(),
                lab = new List<String>(),
                nuker = new List<String>(),
                observer = new List<String>(),
                powerSpawn = new List<String>(),
                road = new List<String>(),
                rampart = new List<String>(),
                constructedWall = new List<String>();

            for (int y = 0; !inFile.EndOfStream; y++)
            {
                string inRaw = inFile.ReadLine();
                string[] inArray = inRaw.Split(',');
                
                for(int x = 0; x < inArray.Length; x++) {
                    switch (inArray[x])
                    {
                        default:
                            break;

                        case "SP":
                            spawn.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;
                            
                        case "EX":
                            extension.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "LI":
                            link.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;
                            
                        case "ST":
                            storage.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "TO":
                            tower.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "OB":
                            observer.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "PS":
                            powerSpawn.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "NU":
                            nuker.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "TR":
                            terminal.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "LB":
                            lab.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "RD":
                            road.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "WL":
                            constructedWall.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;

                        case "RM":
                            rampart.Add("{x: " + (x + numOffsetX.Value).ToString() + ", y: " + (y + numOffsetY.Value).ToString() + "}");
                            break;                            
                    }
                }
            }
            
            StringBuilder output = new StringBuilder();
            formatListStrings(output, spawn, "spawn");
            formatListStrings(output, extension, "extension");
            formatListStrings(output, link, "link");
            formatListStrings(output, storage, "storage");
            formatListStrings(output, tower, "tower");
            formatListStrings(output, terminal, "terminal");
            formatListStrings(output, lab, "lab");
            formatListStrings(output, nuker, "nuker");
            formatListStrings(output, observer, "observer");
            formatListStrings(output, powerSpawn, "powerSpawn");
            formatListStrings(output, road, "road");
            formatListStrings(output, rampart, "rampart");
            formatListStrings(output, constructedWall, "constructedWall");
            
            txtOutput.Text = output.ToString();
        }

        private void formatListStrings(StringBuilder output, List<String> list, string name)
        {
            for (int i = 0; i < list.Count; i++)
            {
                if (i == 0)
                    output.Append(name + ": [ " + list[i]);
                else
                    output.Append(list[i]);

                if (i == list.Count - 1)
                    output.Append(name == "constructedWall" ? " ]\n" : " ],\n");
                else if ((i + 1) % numLineBreak.Value == 0)
                    output.Append(",\n\t");
                else
                    output.Append(", ");
            }
        }

        private void btnClipboard_Click(object sender, EventArgs e)
        {
            Clipboard.SetText(txtOutput.Text);
        }

        private void btnClear_Click(object sender, EventArgs e)
        {
            txtFilePath.Clear();
            numOffsetX.Value = 0;
            numOffsetY.Value = 0;
            numLineBreak.Value = 7;
            txtOutput.Clear();
        }

        private void numOffsetX_Enter(object sender, EventArgs e)
        {
            numOffsetX.Select(0, numOffsetX.Value.ToString().Length);
        }

        private void numOffsetY_Enter(object sender, EventArgs e)
        {
            numOffsetY.Select(0, numOffsetY.Value.ToString().Length);
        }

        private void numLineBreak_Enter(object sender, EventArgs e)
        {
            numLineBreak.Select(0, numLineBreak.Value.ToString().Length);
        }
    }
}
