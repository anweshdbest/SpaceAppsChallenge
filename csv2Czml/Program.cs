using CesiumLanguageWriter;
using System;
using System.Drawing;
using System.IO;

namespace csv2Czml
{
    class Program
    {
        static void Main(string[] args)
        {
            var files = new[]{
                @"Data\ISS11_07_image_data.csv",
                @"Data\ISS11_11_image_data.csv",
                @"Data\ISS12_01_image_data.csv",
                @"Data\ISS12_07_2_image_data.csv",
                @"Data\ISS12_11_image_data.csv",
                @"Data\ISS13_01_image_data.csv",
                @"Data\ISS11_04_image_data.csv"
            };

            foreach (var file in files)
            {
                StringWriter f = new StringWriter();
                var m_output = new CesiumOutputStream(f);
                m_output.PrettyFormatting = false;
                var m_writer = new CesiumStreamWriter();
                m_output.WriteStartSequence();

                string[] lines = File.ReadAllLines(file);
                var rng = new Random();

                GregorianDate start = new GregorianDate();
                for (int i = 1; i < lines.Length; i++)
                {
                    string line = lines[i];
                    string[] tokens = line.Split(new[] { ',' });
                    for (int q = 0; q < tokens.Length; q++)
                    {
                        tokens[q] = tokens[q].Trim('"').Trim();
                    }

                    if (i == 1)
                    {
                        start = GregorianDate.Parse(tokens[17]);
                    }
                    else if (i == lines.Length - 1)
                    {
                        Console.WriteLine(Path.GetFileNameWithoutExtension(file));
                        Console.WriteLine(start.ToJulianDate().TotalDays + " JDate");
                        var stop = GregorianDate.Parse(tokens[17]);
                        Console.WriteLine(stop.ToJulianDate().TotalDays + " JDate");
                        Console.WriteLine();
                        //Console.WriteLine((stop.ToJulianDate() - start.ToJulianDate()).TotalDays);
                    }
                    using (var packet = m_writer.OpenPacket(m_output))
                    {
                        packet.WriteId(tokens[0]);
                        using (var vertexPositions = packet.OpenVertexPositionsProperty())
                        {
                            var points = new Cartographic[]{
                        new Cartographic(double.Parse(tokens[5]), double.Parse(tokens[6]), 0),
                        new Cartographic(double.Parse(tokens[7]), double.Parse(tokens[8]), 0),
                        new Cartographic(double.Parse(tokens[9]), double.Parse(tokens[10]), 0),
                        new Cartographic(double.Parse(tokens[11]), double.Parse(tokens[12]), 0)
                        };
                            vertexPositions.WriteCartographicDegrees(points);
                        }
                        using (var polygon = packet.OpenPolygonProperty())
                        {
                            polygon.WriteShowProperty(true);
                            using (var material = polygon.OpenMaterialProperty())
                            {
                                using (var color = material.OpenSolidColorProperty())
                                {
                                    color.WriteColorProperty(Color.FromArgb(255, (int)(rng.NextDouble() * 255), (int)(rng.NextDouble() * 255), (int)(rng.NextDouble() * 255)));
                                }
                            }
                        }
                    }
                }
                m_output.WriteEndSequence();
                m_output.Dispose();
                File.WriteAllText(Path.GetFileNameWithoutExtension(file) + ".czml", f.ToString());
            }
        }
    }
}
